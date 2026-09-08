import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { NotificationModule } from '../notification/notification.module';
import { MonitorService } from './monitor.service';

@Module({
  imports: [
    ConfigModule,
    BlockchainModule,
    NotificationModule,
  ],
  providers: [MonitorService],
  exports: [MonitorService],
})
export class MonitorModule {}
