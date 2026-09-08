import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { BlockchainService } from '../blockchain/blockchain.service';
import { NotificationService } from '../notification/notification.service';
import { FileLoggerService } from '../../common/services/file-logger.service';
import { StateService } from '../../common/services/state.service';
import { NetworkType } from '../blockchain/interfaces/network-info.interface';

@Injectable()
export class MonitorService implements OnApplicationBootstrap {
  private readonly logger = new Logger(MonitorService.name);
  private isRunningCheck = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly blockchainService: BlockchainService,
    private readonly notificationService: NotificationService,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly fileLoggerService: FileLoggerService,
    private readonly stateService: StateService,
  ) {}

  async onApplicationBootstrap() {
    this.logStartupEvent();
    this.registerCronJob();

    const runOnStartup = this.configService.get<boolean>('scheduler.runOnStartup', true);
    if (runOnStartup) {
      this.logger.log('Initializing startup balance check...');
      setTimeout(() => {
        this.runBalanceCheck().catch((err) =>
          this.logger.error(`Error in startup balance check: ${err.message}`, err.stack),
        );
      }, 2000);
    }
  }

  private logStartupEvent() {
    const rawInterval = this.configService.get<string>('scheduler.rawInterval', '1 Hr');
    const testnetConfig = this.configService.get('networks.testnet');
    const mainnetConfig = this.configService.get('networks.mainnet');
    const wallets = this.configService.get<string[]>('wallets', []);

    this.fileLoggerService.logStartup({
      networks: [
        `${testnetConfig?.name || 'MST Testnet'} (Chain ID: ${testnetConfig?.chainId || 91562037})`,
        `${mainnetConfig?.name || 'MST Mainnet'} (Chain ID: ${mainnetConfig?.chainId || 4646})`,
      ],
      wallets,
      threshold: testnetConfig?.threshold || 0.1,
      interval: rawInterval,
    });
  }

  private registerCronJob() {
    const cronExpression = this.configService.get<string>('scheduler.cron', '0 * * * *');
    const rawInterval = this.configService.get<string>('scheduler.rawInterval', cronExpression);
    try {
      const job = new CronJob(cronExpression, () => {
        this.logger.log(`Cron triggered [${cronExpression}]: Starting scheduled balance check.`);
        this.runBalanceCheck().catch((err) =>
          this.logger.error(`Error in scheduled balance check: ${err.message}`, err.stack),
        );
      });

      this.schedulerRegistry.addCronJob('hourly_wallet_check', job);
      job.start();
      this.logger.log(`Balance check scheduled: "${rawInterval}" (cron: "${cronExpression}")`);
    } catch (err: any) {
      this.logger.error(`Failed to register cron job with expression "${cronExpression}": ${err.message}`);
    }
  }

  async runBalanceCheck(): Promise<void> {
    if (this.isRunningCheck) {
      this.logger.warn('Previous balance check is still in progress. Skipping this cycle.');
      return;
    }

    this.isRunningCheck = true;
    const startTime = Date.now();
    const wallets: string[] = this.configService.get('wallets') || [];
    const networks: NetworkType[] = ['MST_TESTNET', 'MST_MAINNET'];

    if (wallets.length === 0) {
      this.logger.warn('No wallets configured in WALLETS_TO_MONITOR. Nothing to check.');
      this.isRunningCheck = false;
      return;
    }

    this.logger.log(
      `Checking ${wallets.length} wallet(s) across ${networks.length} network(s) (Testnet & Mainnet)...`,
    );

    for (const networkType of networks) {
      const netInfo = this.blockchainService.getNetworkInfo(networkType);

      for (const wallet of wallets) {
        try {
          await this.checkWalletOnNetwork(networkType, wallet);
        } catch (err: any) {
          this.logger.error(
            `Unexpected error checking ${wallet} on ${netInfo.name}: ${err.message}`,
            err.stack,
          );
        }
      }
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    this.logger.log(`Completed balance check cycle in ${elapsed}s.`);
    this.isRunningCheck = false;
  }

  private async checkWalletOnNetwork(
    networkType: NetworkType,
    walletAddress: string,
  ): Promise<void> {
    const result = await this.blockchainService.fetchBalance(networkType, walletAddress);

    if (result.error) {
      this.logger.warn(`RPC error for ${walletAddress} on ${result.networkName}: ${result.error}`);
      return;
    }

    const isCurrentlyLow = this.stateService.isWalletLow(walletAddress, networkType);

    if (result.isLow) {
      if (!isCurrentlyLow) {
        // 1. First time falling below threshold -> SEND EMAIL & LOG TO FILE
        this.logger.warn(
          `[LOW BALANCE] Wallet ${result.walletAddress} fell below threshold on ${result.networkName}: ` +
          `${result.balanceFormatted} ${result.currencySymbol} < ${result.threshold} ${result.currencySymbol}. Dispatching alert!`,
        );

        const alertPayload = {
          networkName: result.networkName,
          networkType: result.network,
          walletAddress: result.walletAddress,
          currentBalance: result.balanceFormatted,
          threshold: result.threshold,
          currencySymbol: result.currencySymbol,
          timestamp: result.timestamp,
          explorerUrl: result.explorerUrl,
        };

        const emailSent = await this.notificationService.sendLowBalanceAlert(alertPayload);
        const recipient = this.configService.get<string[]>('smtp.to', []).join(', ');

        // Record in logs/wallet-watch.log ONLY on this initial alert
        this.fileLoggerService.logLowBalanceAlert(alertPayload, recipient);

        // Update state to prevent duplicate notifications and logs
        this.stateService.setWalletLow(
          walletAddress,
          networkType,
          result.balanceFormatted,
          result.threshold,
        );
      } else {
        // 2. Already alerted and still below threshold -> DO NOTHING (no file log, no email)
        this.logger.log(
          `[SUPPRESSED] Wallet ${result.walletAddress} remains low on ${result.networkName} ` +
          `(${result.balanceFormatted} ${result.currencySymbol}). Notification and file log suppressed.`,
        );
      }
    } else {
      // Balance is >= threshold (Normal/Healthy)
      if (isCurrentlyLow) {
        // 3. Balance recovered! Reset state key silently so future drops alert again.
        // As strictly required: DO NOT write to file log and DO NOT send email.
        this.logger.log(
          `[RECOVERED] Wallet ${result.walletAddress} balance recovered on ${result.networkName}: ` +
          `${result.balanceFormatted} ${result.currencySymbol} >= ${result.threshold} ${result.currencySymbol}. Resetting alert state.`,
        );

        this.stateService.resetWalletLow(
          walletAddress,
          networkType,
          result.balanceFormatted,
          result.threshold,
        );
      } else {
        // Normal healthy balance -> Console log only
        this.logger.log(
          `[OK] Wallet ${result.walletAddress} healthy on ${result.networkName}: ` +
          `${result.balanceFormatted} ${result.currencySymbol} (Threshold: ${result.threshold} ${result.currencySymbol})`,
        );
      }
    }
  }
}
