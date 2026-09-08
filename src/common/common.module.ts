import { Global, Module } from '@nestjs/common';
import { FileLoggerService } from './services/file-logger.service';
import { StateService } from './services/state.service';

@Global()
@Module({
  providers: [FileLoggerService, StateService],
  exports: [FileLoggerService, StateService],
})
export class CommonModule {}
