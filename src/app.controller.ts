import { Controller, Get, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('Monitoring')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Get service health and active configuration status' })
  @ApiResponse({ status: 200, description: 'Service status and network parameters' })
  getHealth() {
    return this.appService.getStatus();
  }

  @Get('status')
  @ApiOperation({ summary: 'Get current alert state of all monitored wallets' })
  @ApiResponse({ status: 200, description: 'List of wallet alert states across networks' })
  getWalletStates() {
    return this.appService.getWalletStates();
  }

  @Get('logs')
  @ApiOperation({ summary: 'Get recent balance check audit logs' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of records to return (default 50)', type: Number })
  @ApiResponse({ status: 200, description: 'List of historical balance checks' })
  getLogs(@Query('limit') limit?: string) {
    const parsedLimit = limit ? parseInt(limit, 10) : 50;
    return this.appService.getRecentLogs(isNaN(parsedLimit) ? 50 : parsedLimit);
  }

  @Post('check-now')
  @ApiOperation({ summary: 'Trigger an immediate on-demand balance check cycle (POST)' })
  @ApiResponse({ status: 200, description: 'Balance check cycle completed' })
  triggerCheckPost() {
    return this.appService.triggerManualCheck();
  }

  @Get('check-now')
  @ApiOperation({ summary: 'Trigger an immediate on-demand balance check cycle (GET)' })
  @ApiResponse({ status: 200, description: 'Balance check cycle completed' })
  triggerCheckGet() {
    return this.appService.triggerManualCheck();
  }
}
