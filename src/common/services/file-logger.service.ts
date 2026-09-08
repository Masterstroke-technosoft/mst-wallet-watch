import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { LowBalanceAlertPayload } from '../../modules/notification/interfaces/alert-payload.interface';

@Injectable()
export class FileLoggerService implements OnModuleInit {
  private readonly logger = new Logger(FileLoggerService.name);
  private readonly logsDir = path.resolve(process.cwd(), 'logs');
  private readonly logFilePath = path.join(this.logsDir, 'wallet-watch.log');

  onModuleInit() {
    this.ensureLogsDirectory();
  }

  private ensureLogsDirectory() {
    try {
      if (!fs.existsSync(this.logsDir)) {
        fs.mkdirSync(this.logsDir, { recursive: true });
      }
    } catch (err: any) {
      this.logger.error(`Failed to create logs directory: ${err.message}`);
    }
  }

  private formatTimestamp(date: Date = new Date()): string {
    const d = date;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 should be 12
    const strHours = String(hours).padStart(2, '0');

    return `${year}-${month}-${day} ${strHours}:${minutes}:${seconds} ${ampm}`;
  }

  logStartup(config: {
    networks: string[];
    wallets: string[];
    threshold: number;
    interval: string;
  }) {
    this.ensureLogsDirectory();
    const timestamp = this.formatTimestamp();
    const walletList =
      config.wallets.length > 0
        ? config.wallets.map((w) => `  - ${w}`).join('\n')
        : '  (None configured)';

    const entry =
`================================================================================
[${timestamp}] SERVER STARTED
Status:             Active & Running
Check Interval:     Every ${config.interval}
Threshold:          ${config.threshold} MSTC / tMSTC
Monitored Networks: ${config.networks.join(', ')}
Monitored Wallets (${config.wallets.length}):
${walletList}
Logging Rule:       Only server startup and initial low-balance alerts are recorded
================================================================================\n\n`;

    this.appendToFile(entry);
  }

  logLowBalanceAlert(payload: LowBalanceAlertPayload, emailRecipient: string) {
    this.ensureLogsDirectory();
    const timestamp = this.formatTimestamp(payload.timestamp);
    const currNum = parseFloat(payload.currentBalance);
    const diff = (payload.threshold - currNum).toFixed(6);

    const entry =
`[${timestamp}] LOW BALANCE ALERT
--------------------------------------------------------------------------------
Network:         ${payload.networkName}
Wallet Address:  ${payload.walletAddress}
Current Balance: ${payload.currentBalance} ${payload.currencySymbol}
Safety Limit:    ${payload.threshold} ${payload.currencySymbol}
Deficit:         Short by ${diff} ${payload.currencySymbol}
Action Taken:    Email alert sent to ${emailRecipient || 'N/A'}
Block Explorer:  ${payload.explorerUrl}
--------------------------------------------------------------------------------\n\n`;

    this.appendToFile(entry);
  }

  private appendToFile(text: string) {
    try {
      fs.appendFileSync(this.logFilePath, text, 'utf-8');
    } catch (err: any) {
      this.logger.error(`Failed to write to log file: ${err.message}`);
    }
  }

  getRecentLogs(limitLines = 200): string {
    try {
      if (!fs.existsSync(this.logFilePath)) {
        return 'No logs recorded yet.';
      }
      const content = fs.readFileSync(this.logFilePath, 'utf-8');
      const lines = content.split('\n');
      if (lines.length <= limitLines) {
        return content;
      }
      return lines.slice(-limitLines).join('\n');
    } catch (err: any) {
      this.logger.error(`Failed to read log file: ${err.message}`);
      return `Error reading log file: ${err.message}`;
    }
  }

  getLogFilePath(): string {
    return this.logFilePath;
  }
}
