import { NetworkType } from './network-info.interface';

export interface WalletBalanceResult {
  network: NetworkType;
  networkName: string;
  walletAddress: string;
  balanceRaw: bigint;
  balanceFormatted: string;
  balanceNumber: number;
  currencySymbol: string;
  threshold: number;
  isLow: boolean;
  explorerUrl: string;
  timestamp: Date;
  error?: string;
}
