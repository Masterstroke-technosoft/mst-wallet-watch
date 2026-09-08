import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { LowBalanceAlertPayload } from './interfaces/alert-payload.interface';
import { generateLowBalanceEmail } from './templates/low-balance-email.template';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private transporter: nodemailer.Transporter | null = null;
  private isConfigured = false;

  constructor(private readonly configService: ConfigService) {
    this.initTransporter();
  }

  private initTransporter() {
    const smtpConfig = this.configService.get('smtp');
    if (!smtpConfig || !smtpConfig.user || !smtpConfig.pass) {
      this.logger.warn(
        'SMTP credentials (SMTP_USER / SMTP_PASS) not configured in .env. Email sending is disabled.',
      );
      this.isConfigured = false;
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: smtpConfig.host,
        port: smtpConfig.port,
        secure: smtpConfig.secure,
        auth: {
          user: smtpConfig.user,
          pass: smtpConfig.pass,
        },
      });
      this.isConfigured = true;
      this.logger.log(`SMTP transporter initialized with host: ${smtpConfig.host}:${smtpConfig.port}`);
    } catch (err: any) {
      this.logger.error(`Failed to initialize SMTP transporter: ${err.message}`);
      this.isConfigured = false;
    }
  }

  async sendLowBalanceAlert(payload: LowBalanceAlertPayload): Promise<boolean> {
    const smtpConfig = this.configService.get('smtp');
    const recipients: string[] = smtpConfig?.to?.length > 0
      ? smtpConfig.to
      : (smtpConfig?.user ? [smtpConfig.user] : []);

    const { subject, text, html } = generateLowBalanceEmail(payload);

    this.logger.warn(
      `[ALERT] Low balance detected: ${payload.walletAddress} on ${payload.networkName} ` +
      `(${payload.currentBalance} ${payload.currencySymbol} < threshold ${payload.threshold} ${payload.currencySymbol})`,
    );

    if (!this.isConfigured || !this.transporter || recipients.length === 0) {
      this.logger.warn(
        `Email alert notification skipped. Reason: ${
          !this.isConfigured ? 'SMTP not configured' : 'No recipients (EMAIL_TO) specified'
        }.`,
      );
      return false;
    }

    try {
      const info = await this.transporter.sendMail({
        from: smtpConfig.from || `"MST WalletWatch" <${smtpConfig.user}>`,
        to: recipients.join(', '),
        subject,
        text,
        html,
      });

      this.logger.log(`Low-balance alert email sent successfully to ${recipients.join(', ')} (Message ID: ${info.messageId})`);
      return true;
    } catch (err: any) {
      this.logger.error(`Failed to send email alert to ${recipients.join(', ')}: ${err.message}`, err.stack);
      return false;
    }
  }
}
