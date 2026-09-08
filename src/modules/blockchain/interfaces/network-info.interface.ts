export type NetworkType = 'MST_TESTNET' | 'MST_MAINNET';

export interface NetworkInfo {
  type: NetworkType;
  name: string;
  rpcUrl: string;
  chainId: number;
  currencySymbol: string;
  explorerUrl: string;
  threshold: number;
}
