import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { MonitorService } from './monitor.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { NotificationService } from '../notification/notification.service';
import { FileLoggerService } from '../../common/services/file-logger.service';
import { StateService } from '../../common/services/state.service';

describe('MonitorService State Machine & File Logging Tests', () => {
  let monitorService: MonitorService;
  let blockchainService: jest.Mocked<BlockchainService>;
  let notificationService: jest.Mocked<NotificationService>;
  let fileLoggerService: jest.Mocked<FileLoggerService>;
  let stateService: StateService;

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn((key: string, defaultValue?: any) => {
        if (key === 'wallets') return ['0x1111111111111111111111111111111111111111'];
        if (key === 'scheduler.runOnStartup') return false;
        if (key === 'scheduler.cron') return '0 * * * *';
        if (key === 'scheduler.rawInterval') return '1 Hr';
        if (key === 'networks.testnet') {
          return { name: 'MST Testnet', chainId: 91562037, threshold: 0.1 };
        }
        if (key === 'networks.mainnet') {
          return { name: 'MST Mainnet', chainId: 4646, threshold: 0.1 };
        }
        if (key === 'smtp.to') return ['test@example.com'];
        return defaultValue;
      }),
    };

    blockchainService = {
      getNetworkInfo: jest.fn().mockReturnValue({
        type: 'MST_TESTNET',
        name: 'MST Testnet',
        currencySymbol: 'tMSTC',
        threshold: 0.1,
        explorerUrl: 'https://testnet.mstscan.com',
      }),
      fetchBalance: jest.fn(),
    } as any;

    notificationService = {
      sendLowBalanceAlert: jest.fn().mockResolvedValue(true),
    } as any;

    fileLoggerService = {
      logStartup: jest.fn(),
      logLowBalanceAlert: jest.fn(),
      getRecentLogs: jest.fn().mockReturnValue('Mock logs content'),
      getLogFilePath: jest.fn().mockReturnValue('/mock/logs/wallet-watch.log'),
    } as any;

    // Use in-memory StateService
    stateService = new StateService();
    // Prevent disk writes during test
    jest.spyOn<any, any>(stateService, 'loadStateFromFile').mockImplementation(() => {});
    jest.spyOn<any, any>(stateService, 'saveStateToFile').mockImplementation(() => {});

    const mockSchedulerRegistry = {
      addCronJob: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MonitorService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: BlockchainService, useValue: blockchainService },
        { provide: NotificationService, useValue: notificationService },
        { provide: SchedulerRegistry, useValue: mockSchedulerRegistry },
        { provide: FileLoggerService, useValue: fileLoggerService },
        { provide: StateService, useValue: stateService },
      ],
    }).compile();

    monitorService = module.get<MonitorService>(MonitorService);
  });

  it('1. Sends email alert AND writes to log file when balance drops below 0.1 on first check', async () => {
    blockchainService.fetchBalance.mockResolvedValue({
      network: 'MST_TESTNET',
      networkName: 'MST Testnet',
      walletAddress: '0x1111111111111111111111111111111111111111',
      balanceRaw: BigInt('50000000000000000'),
      balanceFormatted: '0.05',
      balanceNumber: 0.05,
      currencySymbol: 'tMSTC',
      threshold: 0.1,
      isLow: true,
      explorerUrl: 'https://testnet.mstscan.com/address/0x1111111111111111111111111111111111111111',
      timestamp: new Date(),
    });

    await monitorService.runBalanceCheck();

    expect(notificationService.sendLowBalanceAlert).toHaveBeenCalled();
    expect(fileLoggerService.logLowBalanceAlert).toHaveBeenCalled();
    expect(stateService.isWalletLow('0x1111111111111111111111111111111111111111', 'MST_TESTNET')).toBe(true);
  });

  it('2. Suppresses both notification AND file log writing on subsequent checks while balance remains low', async () => {
    // Pre-populate wallet as already low
    stateService.setWalletLow('0x1111111111111111111111111111111111111111', 'MST_TESTNET', '0.05', 0.1);
    stateService.setWalletLow('0x1111111111111111111111111111111111111111', 'MST_MAINNET', '0.05', 0.1);

    blockchainService.fetchBalance.mockResolvedValue({
      network: 'MST_TESTNET',
      networkName: 'MST Testnet',
      walletAddress: '0x1111111111111111111111111111111111111111',
      balanceRaw: BigInt('40000000000000000'),
      balanceFormatted: '0.04',
      balanceNumber: 0.04,
      currencySymbol: 'tMSTC',
      threshold: 0.1,
      isLow: true,
      explorerUrl: 'https://testnet.mstscan.com/address/0x1111111111111111111111111111111111111111',
      timestamp: new Date(),
    });

    await monitorService.runBalanceCheck();

    // Must NOT send email and must NOT write to log file
    expect(notificationService.sendLowBalanceAlert).not.toHaveBeenCalled();
    expect(fileLoggerService.logLowBalanceAlert).not.toHaveBeenCalled();
  });

  it('3. Resets isLow flag upon recovery without sending email and without writing to log file', async () => {
    stateService.setWalletLow('0x1111111111111111111111111111111111111111', 'MST_TESTNET', '0.05', 0.1);
    stateService.setWalletLow('0x1111111111111111111111111111111111111111', 'MST_MAINNET', '0.05', 0.1);

    // Balance recovered to 1.5 (> 0.1 threshold)
    blockchainService.fetchBalance.mockResolvedValue({
      network: 'MST_TESTNET',
      networkName: 'MST Testnet',
      walletAddress: '0x1111111111111111111111111111111111111111',
      balanceRaw: BigInt('1500000000000000000'),
      balanceFormatted: '1.5',
      balanceNumber: 1.5,
      currencySymbol: 'tMSTC',
      threshold: 0.1,
      isLow: false,
      explorerUrl: 'https://testnet.mstscan.com/address/0x1111111111111111111111111111111111111111',
      timestamp: new Date(),
    });

    await monitorService.runBalanceCheck();

    // Flag is reset to false
    expect(stateService.isWalletLow('0x1111111111111111111111111111111111111111', 'MST_TESTNET')).toBe(false);
    // Neither email nor log file write should occur
    expect(notificationService.sendLowBalanceAlert).not.toHaveBeenCalled();
    expect(fileLoggerService.logLowBalanceAlert).not.toHaveBeenCalled();
  });
});
