# MST-WalletWatch

**MST-WalletWatch** is an enterprise-grade backend monitoring and alerting service designed for the MST Blockchain ecosystem. It monitors native currency balances on **MST Testnet** (`tMSTC`) and **MST Mainnet** (`MSTC`) on a configurable schedule and dispatches automated email alerts via SMTP whenever any monitored wallet's balance drops below a configured safety threshold (e.g., `0.1 MSTC`).

---

## Key Features

- **Multi-Network EVM Support**: Native balance monitoring for **MST Testnet** (Chain ID: `91562037`) and **MST Mainnet** (Chain ID: `4646`) using `ethers.js` v6.
- **Robust Error Handling**: Automatic 3-attempt exponential backoff retries on RPC calls, checksum address validation, and isolated execution per wallet so a single issue never halts monitoring.
- **Flexible Scheduler**: Supports human-readable intervals (`1 Hr`, `30 Min`, `10 Mint`, `5 Min`, `1 Min`, `15 Sec`) or standard cron expressions via `CHECK_INTERVAL`.
- **Intelligent Anti-Spam Alert State Machine**:
  - Sends an email alert **only once** when a wallet crosses below the threshold.
  - Keeps checking on subsequent cycles without spamming duplicate alerts.
  - Automatically resets the alert state key when the wallet is topped up (balance >= threshold) so future drops will trigger new alerts.
  - Suppression policy: No unnecessary recovery emails are sent upon top-up.
- **Zero Database Overhead (Root File Logging & Local State)**:
  - `logs/wallet-watch.log`: Clean, human-readable log recording **only** server startup and initial low-balance alerts.
  - `logs/state.json`: Lightweight local state file remembering alert states across server restarts without needing MongoDB or external databases.
- **Rich HTML & Plain-Text Email Notifications**: Clean, responsive email template highlighting current balance, configured threshold, deficit, timestamp, and a direct link to the MST block explorer.
- **Zero Hardcoding**: 100% of network configurations, thresholds, schedules, and credentials are dynamically loaded and validated from environment variables.
- **Interactive Swagger UI**: Full OpenAPI 3.0 documentation available at `http://localhost:3000/api/docs`.
- **REST Observability API**:
  - `GET /api/docs`: Interactive Swagger API documentation.
  - `GET /`: Service health and network configuration status.
  - `GET /status`: Current alert states across all monitored wallets.
  - `GET /logs`: Recent human-readable logs from `logs/wallet-watch.log`.
  - `POST /check-now` or `GET /check-now`: Manually trigger an immediate balance check on demand.

---

## Network Parameters

| Parameter | MST Testnet | MST Mainnet |
|---|---|---|
| **Network Name** | MST Testnet | MST Mainnet |
| **RPC URL** | `https://testnetrpc.mstblockchain.com` | `https://mariorpc.mstblockchain.com` |
| **Chain ID** | `91562037` (`0x5752035`) | `4646` (`0x1226`) |
| **Currency Symbol** | `tMSTC` | `MSTC` |
| **Block Explorer** | `https://testnet.mstscan.com` | `https://mstscan.com` |
| **Decimals** | 18 | 18 |

---

## Prerequisites

- **Node.js**: v18+ (tested on Node.js v20)
- **SMTP Credentials**: Gmail App Password or custom SMTP server for sending email notifications.

---

## Installation & Setup

1. **Clone the repository and install dependencies**:
   ```bash
   cd d:/MST-WalletWatch
   npm install
   ```

2. **Configure environment variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

3. **Edit `.env` with your settings**:
   ```env
   # Wallets to monitor (comma-separated EVM addresses)
   WALLETS_TO_MONITOR=0x9e4cd50CB06C50BbC086bf013D6913c14AF29FBf,0x7b92aa68e8FeAC1a83CE1a2e1D79aE5f28696038

   # Thresholds in native units (default: 0.1)
   BALANCE_THRESHOLD_TESTNET=0.1
   BALANCE_THRESHOLD_MAINNET=0.1

   # Scheduler interval (e.g. "1 Hr", "30 Min", "10 Mint", "5 Min", or cron "0 * * * *")
   CHECK_INTERVAL=1 Hr
   RUN_ON_STARTUP=true

   # Email / SMTP Credentials (Gmail example with port 465 SSL)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=465
   SMTP_SECURE=true
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_16_character_app_password
   EMAIL_FROM="MST WalletWatch" <alerts@walletwatch.io>
   EMAIL_TO=recipient@example.com
   ```

---

## Running the Service

### Development Mode (with hot-reload)
```bash
npm run start:dev
```

### Production Build & Run
```bash
npm run build
npm run start:prod
```

Upon launch, the service connects to both MST RPC endpoints, initializes the root `logs/` directory, registers the schedule, and immediately runs an initial balance check across all configured wallets.

---

## Environment Variables Reference

| Variable | Default | Description |
|---|---|---|
| `TESTNET_RPC_URL` | `https://testnetrpc.mstblockchain.com` | MST Testnet JSON-RPC endpoint |
| `MAINNET_RPC_URL` | `https://mariorpc.mstblockchain.com` | MST Mainnet JSON-RPC endpoint |
| `TESTNET_CHAIN_ID` | `91562037` | MST Testnet chain identifier |
| `MAINNET_CHAIN_ID` | `4646` | MST Mainnet chain identifier |
| `TESTNET_EXPLORER_URL` | `https://testnet.mstscan.com` | Testnet block explorer URL |
| `MAINNET_EXPLORER_URL` | `https://mstscan.com` | Mainnet block explorer URL |
| `TESTNET_CURRENCY_SYMBOL` | `tMSTC` | Testnet currency symbol |
| `MAINNET_CURRENCY_SYMBOL` | `MSTC` | Mainnet currency symbol |
| `WALLETS_TO_MONITOR` | *Required* | Comma-separated EVM wallet addresses to monitor |
| `BALANCE_THRESHOLD_TESTNET`| `0.1` | Minimum balance threshold for Testnet in `tMSTC` |
| `BALANCE_THRESHOLD_MAINNET`| `0.1` | Minimum balance threshold for Mainnet in `MSTC` |
| `CHECK_INTERVAL` | `1 Hr` | Schedule interval (e.g. `1 Hr`, `30 Min`, `10 Mint`, `5 Min`, or cron `0 * * * *`) |
| `RUN_ON_STARTUP` | `true` | Runs an immediate balance check when app starts |
| `SMTP_HOST` | `smtp.gmail.com` | Outgoing SMTP mail server |
| `SMTP_PORT` | `465` | SMTP port (465 for SSL, 587 for TLS) |
| `SMTP_SECURE` | `true` | Set to `true` for port 465, `false` for 587 |
| `SMTP_USER` | *Required for email* | SMTP account username / email address |
| `SMTP_PASS` | *Required for email* | SMTP password or Google App Password |
| `EMAIL_FROM` | `"MST WalletWatch" <...>` | Sender header in dispatched emails |
| `EMAIL_TO` | *Required for email* | Alert recipient address (supports comma-separated) |
| `PORT` | `3000` | HTTP port for the REST API |

---

## Log File Format (`logs/wallet-watch.log`)

The root `logs/wallet-watch.log` file uses clean, human-readable formatting and strictly follows a **2-event only** logging rule:

### 1. Server Startup Event (Logged once on application boot)
```text
================================================================================
[2026-09-08 11:30:00 AM] SERVER STARTED
Status:             Active & Running
Check Interval:     Every 1 Hr
Threshold:          0.1 MSTC / tMSTC
Monitored Networks: MST Testnet (Chain ID: 91562037), MST Mainnet (Chain ID: 4646)
Monitored Wallets (2):
  - 0x9e4cd50CB06C50BbC086bf013D6913c14AF29FBf
  - 0x7b92aa68e8FeAC1a83CE1a2e1D79aE5f28696038
Logging Rule:       Only server startup and initial low-balance alerts are recorded
================================================================================
```

### 2. Initial Low Balance Alert Event (1:1 with Email Dispatch)
```text
[2026-09-08 11:35:01 AM] LOW BALANCE ALERT
--------------------------------------------------------------------------------
Network:         MST Testnet
Wallet Address:  0x7b92aa68e8FeAC1a83CE1a2e1D79aE5f28696038
Current Balance: 0.0000105 tMSTC
Safety Limit:    0.1 tMSTC
Deficit:         Short by 0.0999895 tMSTC
Action Taken:    Email alert sent to recipient@example.com
Block Explorer:  https://testnet.mstscan.com/address/0x7b92aa68e8FeAC1a83CE1a2e1D79aE5f28696038
--------------------------------------------------------------------------------
```

*(Healthy checks, repeat low balance checks, and balance top-ups produce **zero** log file clutter and **zero** emails)*

---

## Error Handling & Resilience

- **RPC Failures**: Every `eth_getBalance` call automatically retries up to 3 times with exponential backoff (1s, 2s, 4s).
- **Address Validation**: Addresses are checksummed via `ethers.getAddress()`; malformed addresses are flagged in console logs without throwing unhandled exceptions.
- **Isolated Wallet Checks**: Each wallet check on each network is isolated in its own try/catch block so a network timeout on one wallet cannot prevent other wallets from being verified.
- **Email Resilience**: SMTP delivery failures are caught and logged to console with the exact provider error message, ensuring the monitoring loop continues running.
- **Overlap Prevention**: The scheduler uses an `isRunningCheck` lock to prevent overlapping runs if an RPC query takes longer than the scheduled interval.

---

## Setting Up Gmail App Password

If you are using Gmail for SMTP notifications:
1. Go to your **Google Account** -> **Security**.
2. Ensure **2-Step Verification** is turned **ON**.
3. Search for **App Passwords** (or visit `https://myaccount.google.com/apppasswords`).
4. Generate a new App Password named `MST-WalletWatch`.
5. Copy the 16-character code into `.env`:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=465
   SMTP_SECURE=true
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=twevcunogdbihluz
   EMAIL_FROM="MST WalletWatch" <your_email@gmail.com>
   EMAIL_TO=your_email@gmail.com
   ```

---

## REST API Endpoints

The service includes built-in HTTP endpoints for monitoring and testing:

### 1. Interactive Swagger UI
Open in your browser:
```
http://localhost:3000/api/docs
```

### 2. Health & Config Status
```bash
curl http://localhost:3000/
```

### 3. Current Wallet States
```bash
curl http://localhost:3000/status
```
Returns each monitored wallet's status (`isLow`, `lastBalance`, `threshold`, `lastAlertSentAt`).

### 4. Recent Logs
```bash
curl http://localhost:3000/logs
```
Returns the contents of `logs/wallet-watch.log`.

### 5. Trigger Check Immediately (On-Demand)
```bash
curl -X POST http://localhost:3000/check-now
```
Runs a complete check cycle across all wallets and networks without waiting for the next scheduled interval.

---

## Testing

Run the automated unit test suite:
```bash
npm test
```

The test suite includes 13 tests validating:
- **Interval Parser**: Human-readable interval parsing (hours, minutes, seconds, days, cron).
- **State Machine**: Alert dispatch on initial drop (< 0.1 threshold).
- **Suppression**: Zero notifications and zero log file writes while balance remains low.
- **Recovery**: Silent reset of `isLow` state without sending recovery email or writing to log file.
- **Controllers**: Endpoints for `/`, `/status`, `/logs`, and `/check-now`.
