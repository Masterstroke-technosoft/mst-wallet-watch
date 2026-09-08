import { parseIntervalToCron } from '../common/utils/interval-parser.util';

export interface NetworkConfig {
  name: string;
  rpcUrl: string;
  chainId: number;
  currencySymbol: string;
  explorerUrl: string;
  threshold: number;
}

export interface AppConfig {
  networks: {
    testnet: NetworkConfig;
    mainnet: NetworkConfig;
  };
  wallets: string[];
  scheduler: {
    rawInterval: string;
    cron: string;
    runOnStartup: boolean;
  };
  smtp: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    pass: string;
    from: string;
    to: string[];
  };
}

export default (): AppConfig => {
  const parseWallets = (raw?: string): string[] => {
    if (!raw) return [];
    const list = raw
      .split(',')
      .map((w) => w.trim())
      .filter((w) => w.length > 0);
    const seen = new Set<string>();
    const unique: string[] = [];
    for (const w of list) {
      const lower = w.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        unique.push(w);
      }
    }
    return unique;
  };

  const parseRecipients = (raw?: string): string[] => {
    if (!raw) return [];
    return raw
      .split(',')
      .map((e) => e.trim())
      .filter((e) => e.length > 0);
  };

  return {
    networks: {
      testnet: {
        name: 'MST Testnet',
        rpcUrl: process.env.TESTNET_RPC_URL || 'https://testnetrpc.mstblockchain.com',
        chainId: parseInt(process.env.TESTNET_CHAIN_ID || '91562037', 10),
        currencySymbol: process.env.TESTNET_CURRENCY_SYMBOL || 'tMSTC',
        explorerUrl: process.env.TESTNET_EXPLORER_URL || 'https://testnet.mstscan.com',
        threshold: parseFloat(process.env.BALANCE_THRESHOLD_TESTNET || '0.1'),
      },
      mainnet: {
        name: 'MST Mainnet',
        rpcUrl: process.env.MAINNET_RPC_URL || 'https://mariorpc.mstblockchain.com',
        chainId: parseInt(process.env.MAINNET_CHAIN_ID || '4646', 10),
        currencySymbol: process.env.MAINNET_CURRENCY_SYMBOL || 'MSTC',
        explorerUrl: process.env.MAINNET_EXPLORER_URL || 'https://mstscan.com',
        threshold: parseFloat(process.env.BALANCE_THRESHOLD_MAINNET || '0.1'),
      },
    },
    wallets: parseWallets(process.env.WALLETS_TO_MONITOR),
    scheduler: {
      rawInterval: process.env.CHECK_INTERVAL || process.env.CHECK_INTERVAL_CRON || '1 Hr',
      cron: parseIntervalToCron(process.env.CHECK_INTERVAL || process.env.CHECK_INTERVAL_CRON || '1 Hr'),
      runOnStartup: process.env.RUN_ON_STARTUP === 'true' || process.env.RUN_ON_STARTUP === undefined,
    },
    smtp: {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
      from: process.env.EMAIL_FROM || '"MST WalletWatch" <alerts@walletwatch.io>',
      to: parseRecipients(process.env.EMAIL_TO),
    },
  };
};
