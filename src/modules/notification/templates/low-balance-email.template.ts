import { LowBalanceAlertPayload } from '../interfaces/alert-payload.interface';

export function generateLowBalanceEmail(payload: LowBalanceAlertPayload): {
  subject: string;
  text: string;
  html: string;
} {
  const subject = `[ALERT] Low Balance on ${payload.networkName}: ${payload.walletAddress.substring(0, 6)}...${payload.walletAddress.slice(-4)}`;

  const text = `
LOW BALANCE ALERT
=================
Network: ${payload.networkName}
Wallet Address: ${payload.walletAddress}
Current Balance: ${payload.currentBalance} ${payload.currencySymbol}
Minimum Threshold: ${payload.threshold} ${payload.currencySymbol}
Timestamp: ${payload.timestamp.toISOString()}
Explorer Link: ${payload.explorerUrl}

Please refill the wallet immediately to prevent transaction failures.
`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MST-WalletWatch Alert</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f4f7f6;
      margin: 0;
      padding: 24px;
      color: #2d3748;
    }
    .container {
      max-width: 580px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
      border: 1px solid #e2e8f0;
    }
    .header {
      background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%);
      color: #ffffff;
      padding: 28px 24px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 22px;
      font-weight: 700;
      letter-spacing: 0.5px;
    }
    .header p {
      margin: 6px 0 0;
      font-size: 14px;
      opacity: 0.92;
    }
    .content {
      padding: 24px;
    }
    .card {
      background-color: #fff5f5;
      border-left: 4px solid #e53e3e;
      padding: 16px;
      border-radius: 6px;
      margin-bottom: 20px;
    }
    .card-title {
      font-size: 14px;
      font-weight: 600;
      color: #c53030;
      margin: 0 0 4px 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .card-desc {
      margin: 0;
      font-size: 13px;
      color: #4a5568;
    }
    .info-table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
    }
    .info-table td {
      padding: 12px 8px;
      border-bottom: 1px solid #edf2f7;
      font-size: 14px;
    }
    .info-table td.label {
      color: #718096;
      font-weight: 500;
      width: 38%;
    }
    .info-table td.value {
      color: #1a202c;
      font-weight: 600;
      text-align: right;
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
      word-break: break-all;
    }
    .info-table td.value.highlight {
      color: #e53e3e;
      font-size: 16px;
    }
    .button-container {
      text-align: center;
      margin: 28px 0 16px;
    }
    .btn {
      display: inline-block;
      background: #3182ce;
      color: #ffffff !important;
      text-decoration: none;
      padding: 12px 28px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 14px;
      transition: background 0.2s ease;
    }
    .btn:hover {
      background: #2b6cb0;
    }
    .footer {
      background-color: #f7fafc;
      padding: 16px 24px;
      text-align: center;
      font-size: 12px;
      color: #a0aec0;
      border-top: 1px solid #edf2f7;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Low Balance Warning</h1>
      <p>Automated Alert from MST-WalletWatch</p>
    </div>
    <div class="content">
      <div class="card">
        <p class="card-title">Threshold Breached</p>
        <p class="card-desc">The wallet balance has fallen below the configured safety threshold. Please review and top up.</p>
      </div>

      <table class="info-table">
        <tr>
          <td class="label">Network</td>
          <td class="value">${payload.networkName}</td>
        </tr>
        <tr>
          <td class="label">Wallet Address</td>
          <td class="value">${payload.walletAddress}</td>
        </tr>
        <tr>
          <td class="label">Current Balance</td>
          <td class="value highlight">${payload.currentBalance} ${payload.currencySymbol}</td>
        </tr>
        <tr>
          <td class="label">Minimum Threshold</td>
          <td class="value">${payload.threshold} ${payload.currencySymbol}</td>
        </tr>
        <tr>
          <td class="label">Alert Timestamp</td>
          <td class="value" style="font-family: inherit; font-size: 13px;">${payload.timestamp.toUTCString()}</td>
        </tr>
      </table>

      <div class="button-container">
        <a href="${payload.explorerUrl}" class="btn" target="_blank" rel="noopener noreferrer">View on Block Explorer</a>
      </div>
    </div>
    <div class="footer">
      MST-WalletWatch - Real-time EVM Balance Monitoring System
    </div>
  </div>
</body>
</html>
`;

  return { subject, text, html };
}
