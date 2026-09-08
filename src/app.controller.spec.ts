import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;
  let appService: jest.Mocked<AppService>;

  beforeEach(async () => {
    const mockAppService = {
      getStatus: jest.fn().mockReturnValue({
        service: 'MST-WalletWatch',
        status: 'ONLINE',
      }),
      getWalletStates: jest.fn().mockReturnValue([]),
      getRecentLogs: jest.fn().mockReturnValue({ logFilePath: 'mock.log', content: 'Sample log content' }),
      triggerManualCheck: jest.fn().mockResolvedValue({ success: true }),
    };

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [{ provide: AppService, useValue: mockAppService }],
    }).compile();

    appController = app.get<AppController>(AppController);
    appService = app.get(AppService);
  });

  describe('health and status endpoints', () => {
    it('should return service status', () => {
      const result = appController.getHealth();
      expect(result.service).toBe('MST-WalletWatch');
      expect(result.status).toBe('ONLINE');
    });

    it('should return wallet states', () => {
      const result = appController.getWalletStates();
      expect(result).toEqual([]);
    });

    it('should return recent logs', () => {
      const result = appController.getLogs('50');
      expect(result).toEqual({ logFilePath: 'mock.log', content: 'Sample log content' });
    });

    it('should trigger manual check', async () => {
      const result = await appController.triggerCheckGet();
      expect(result.success).toBe(true);
    });
  });
});
