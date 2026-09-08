import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface WalletStateRecord {
  walletAddress: string;
  network: string;
  isLow: boolean;
  lastBalance?: string;
  threshold?: number;
  lastAlertSentAt?: string;
  lastCheckedAt?: string;
}

@Injectable()
export class StateService implements OnModuleInit {
  private readonly logger = new Logger(StateService.name);
  private readonly logsDir = path.resolve(process.cwd(), 'logs');
  private readonly stateFilePath = path.join(this.logsDir, 'state.json');
  private states = new Map<string, WalletStateRecord>();

  onModuleInit() {
    this.loadStateFromFile();
  }

  private getKey(walletAddress: string, network: string): string {
    return `${walletAddress.toLowerCase()}-${network}`;
  }

  private loadStateFromFile() {
    try {
      if (!fs.existsSync(this.logsDir)) {
        fs.mkdirSync(this.logsDir, { recursive: true });
      }

      if (fs.existsSync(this.stateFilePath)) {
        const raw = fs.readFileSync(this.stateFilePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (typeof parsed === 'object' && parsed !== null) {
          for (const [key, val] of Object.entries(parsed)) {
            this.states.set(key, val as WalletStateRecord);
          }
        }
      }
    } catch (err: any) {
      this.logger.warn(`Could not load existing state file: ${err.message}. Starting fresh.`);
    }
  }

  private saveStateToFile() {
    try {
      if (!fs.existsSync(this.logsDir)) {
        fs.mkdirSync(this.logsDir, { recursive: true });
      }
      const obj: Record<string, WalletStateRecord> = {};
      for (const [k, v] of this.states.entries()) {
        obj[k] = v;
      }
      fs.writeFileSync(this.stateFilePath, JSON.stringify(obj, null, 2), 'utf-8');
    } catch (err: any) {
      this.logger.error(`Failed to save state to file: ${err.message}`);
    }
  }

  isWalletLow(walletAddress: string, network: string): boolean {
    const key = this.getKey(walletAddress, network);
    const existing = this.states.get(key);
    return existing ? Boolean(existing.isLow) : false;
  }

  setWalletLow(walletAddress: string, network: string, balance: string, threshold: number): void {
    const key = this.getKey(walletAddress, network);
    const record: WalletStateRecord = {
      walletAddress: walletAddress.toLowerCase(),
      network,
      isLow: true,
      lastBalance: balance,
      threshold,
      lastAlertSentAt: new Date().toISOString(),
      lastCheckedAt: new Date().toISOString(),
    };
    this.states.set(key, record);
    this.saveStateToFile();
  }

  resetWalletLow(walletAddress: string, network: string, balance: string, threshold: number): void {
    const key = this.getKey(walletAddress, network);
    const existing = this.states.get(key);
    const record: WalletStateRecord = {
      walletAddress: walletAddress.toLowerCase(),
      network,
      isLow: false,
      lastBalance: balance,
      threshold,
      lastAlertSentAt: existing?.lastAlertSentAt,
      lastCheckedAt: new Date().toISOString(),
    };
    this.states.set(key, record);
    this.saveStateToFile();
  }

  getAllStates(): WalletStateRecord[] {
    return Array.from(this.states.values());
  }

  clearState(): void {
    this.states.clear();
    this.saveStateToFile();
  }
}
