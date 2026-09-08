export interface LowBalanceAlertPayload {
  networkName: string;
  networkType: string;
  walletAddress: string;
  currentBalance: string;
  threshold: number;
  currencySymbol: string;
  timestamp: Date;
  explorerUrl: string;
}
