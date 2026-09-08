import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers, formatEther, isAddress, getAddress } from 'ethers';
import { NetworkInfo, NetworkType } from './interfaces/network-info.interface';
import { WalletBalanceResult } from './interfaces/wallet-balance.interface';

@Injectable()
export class BlockchainService implements OnModuleInit {
  private readonly logger = new Logger(BlockchainService.name);
  private providers = new Map<NetworkType, ethers.JsonRpcProvider>();
  private networks = new Map<NetworkType, NetworkInfo>();

  constructor(private readonly configService: ConfigService) {
    const testnetConfig = this.configService.get('networks.testnet');
    const mainnetConfig = this.configService.get('networks.mainnet');

    this.networks.set('MST_TESTNET', {
      type: 'MST_TESTNET',
      name: testnetConfig.name,
      rpcUrl: testnetConfig.rpcUrl,
      chainId: testnetConfig.chainId,
      currencySymbol: testnetConfig.currencySymbol,
      explorerUrl: testnetConfig.explorerUrl,
      threshold: testnetConfig.threshold,
    });

    this.networks.set('MST_MAINNET', {
      type: 'MST_MAINNET',
      name: mainnetConfig.name,
      rpcUrl: mainnetConfig.rpcUrl,
      chainId: mainnetConfig.chainId,
      currencySymbol: mainnetConfig.currencySymbol,
      explorerUrl: mainnetConfig.explorerUrl,
      threshold: mainnetConfig.threshold,
    });
  }

  async onModuleInit() {
    for (const [type, net] of this.networks.entries()) {
      try {
        const provider = new ethers.JsonRpcProvider(net.rpcUrl, {
          chainId: net.chainId,
          name: net.name,
        }, {
          staticNetwork: true,
        });

        this.providers.set(type, provider);

        // Verify connection and chainId
        const blockNumber = await this.retryOperation(() => provider.getBlockNumber(), 3, 1000);
        this.logger.log(
          `Connected to ${net.name} (Chain ID: ${net.chainId}) at block #${blockNumber}`,
        );
      } catch (err: any) {
        this.logger.error(
          `Failed initial connection to ${net.name} (${net.rpcUrl}): ${err.message}`,
        );
      }
    }
  }

  getNetworkInfo(networkType: NetworkType): NetworkInfo {
    const net = this.networks.get(networkType);
    if (!net) {
      throw new Error(`Network ${networkType} not configured`);
    }
    return net;
  }

  getAllNetworks(): NetworkInfo[] {
    return Array.from(this.networks.values());
  }

  getProvider(networkType: NetworkType): ethers.JsonRpcProvider {
    let provider = this.providers.get(networkType);
    if (!provider) {
      const net = this.getNetworkInfo(networkType);
      provider = new ethers.JsonRpcProvider(net.rpcUrl, {
        chainId: net.chainId,
        name: net.name,
      }, {
        staticNetwork: true,
      });
      this.providers.set(networkType, provider);
    }
    return provider;
  }

  async fetchBalance(
    networkType: NetworkType,
    rawAddress: string,
  ): Promise<WalletBalanceResult> {
    const net = this.getNetworkInfo(networkType);
    const provider = this.getProvider(networkType);
    const now = new Date();

    if (!isAddress(rawAddress)) {
      this.logger.warn(`Invalid EVM address: ${rawAddress}`);
      return {
        network: networkType,
        networkName: net.name,
        walletAddress: rawAddress,
        balanceRaw: 0n,
        balanceFormatted: '0.0',
        balanceNumber: 0,
        currencySymbol: net.currencySymbol,
        threshold: net.threshold,
        isLow: false,
        explorerUrl: `${net.explorerUrl}/address/${rawAddress}`,
        timestamp: now,
        error: `Invalid EVM wallet address: ${rawAddress}`,
      };
    }

    const checksummedAddress = getAddress(rawAddress);

    try {
      const balanceWei = await this.retryOperation(
        () => provider.getBalance(checksummedAddress),
        3,
        1500,
      );

      const balanceFormatted = formatEther(balanceWei);
      const balanceNumber = parseFloat(balanceFormatted);
      const isLow = balanceNumber < net.threshold;

      return {
        network: networkType,
        networkName: net.name,
        walletAddress: checksummedAddress,
        balanceRaw: balanceWei,
        balanceFormatted,
        balanceNumber,
        currencySymbol: net.currencySymbol,
        threshold: net.threshold,
        isLow,
        explorerUrl: `${net.explorerUrl}/address/${checksummedAddress}`,
        timestamp: now,
      };
    } catch (err: any) {
      this.logger.error(
        `Failed to fetch balance for ${checksummedAddress} on ${net.name}: ${err.message}`,
      );
      return {
        network: networkType,
        networkName: net.name,
        walletAddress: checksummedAddress,
        balanceRaw: 0n,
        balanceFormatted: '0.0',
        balanceNumber: 0,
        currencySymbol: net.currencySymbol,
        threshold: net.threshold,
        isLow: false,
        explorerUrl: `${net.explorerUrl}/address/${checksummedAddress}`,
        timestamp: now,
        error: err.message || 'Unknown RPC error',
      };
    }
  }

  private async retryOperation<T>(
    fn: () => Promise<T>,
    maxRetries = 3,
    delayMs = 1000,
  ): Promise<T> {
    let lastError: any;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err;
        if (attempt < maxRetries) {
          const waitTime = delayMs * Math.pow(2, attempt - 1);
          await new Promise((res) => setTimeout(res, waitTime));
        }
      }
    }
    throw lastError;
  }
}
