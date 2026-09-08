import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MonitorService } from './modules/monitor/monitor.service';
import { FileLoggerService } from './common/services/file-logger.service';
import { StateService } from './common/services/state.service';

@Injectable()
export class AppService {
  constructor(
    private readonly configService: ConfigService,
    private readonly monitorService: MonitorService,
    private readonly fileLoggerService: FileLoggerService,
    private readonly stateService: StateService,
  ) {}

  getStatus() {
    return {
      service: 'MST-WalletWatch',
      status: 'ONLINE',
      timestamp: new Date().toISOString(),
      scheduleInterval: this.configService.get('scheduler.rawInterval', '1 Hr'),
      cronSchedule: this.configService.get('scheduler.cron'),
      networks: {
        testnet: this.configService.get('networks.testnet'),
        mainnet: this.configService.get('networks.mainnet'),
      },
      monitoredWalletsCount: (this.configService.get<string[]>('wallets') || []).length,
      monitoredWallets: this.configService.get<string[]>('wallets') || [],
      logFile: this.fileLoggerService.getLogFilePath(),
    };
  }

  async triggerManualCheck() {
    await this.monitorService.runBalanceCheck();
    return {
      success: true,
      message: 'Balance check cycle completed successfully.',
      timestamp: new Date().toISOString(),
    };
  }

  getRecentLogs(limitLines = 100) {
    return {
      logFilePath: this.fileLoggerService.getLogFilePath(),
      content: this.fileLoggerService.getRecentLogs(limitLines),
    };
  }

  getWalletStates() {
    return this.stateService.getAllStates();
  }
}
