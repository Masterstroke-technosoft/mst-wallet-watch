import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import configuration from './config/configuration';
import { validate } from './config/env.validation';
import { CommonModule } from './common/common.module';
import { BlockchainModule } from './modules/blockchain/blockchain.module';
import { NotificationModule } from './modules/notification/notification.module';
import { MonitorModule } from './modules/monitor/monitor.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate,
    }),
    ScheduleModule.forRoot(),
    CommonModule,
    BlockchainModule,
    NotificationModule,
    MonitorModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
