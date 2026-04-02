---
name: poly-master
description: Polymarket copy-trading skill. Follow top prediction market traders and automatically copy their positions. Supports trader discovery, configurable copy ratios, risk management (stop-loss, take-profit, position limits), and PnL reporting. Zero custody — all signing happens in user's wallet via hosted signing pages.
metadata: {"clawdbot":{"emoji":"🎯","requires":{"bins":["node"]}}}
---

# Poly Master — Polymarket Copy Trading

## What it does

Poly Master lets users copy-trade top Polymarket prediction market traders through natural conversation:

1. **Discover traders** — Browse top performers by win rate, ROI, and trade volume
2. **Configure copy trading** — Set which traders to follow, copy ratio, and risk parameters
3. **Execute trades** — Monitor followed traders and mirror their positions (with user wallet signing)
4. **Manage risk** — Stop-loss, take-profit, position limits, max slippage tolerance
5. **Track performance** — PnL reports by day/week/month, per-trader breakdown

## Architecture

```
User ←→ OpenClaw Agent ←→ MCP Tools ←→ Polymarket CLOB API
                                  ↕
                          Signing Server (Express)
                                  ↕
                          User's Wallet (MetaMask/OKX/Trust/TokenPocket)
```

- **Zero custody**: Private keys never leave the user's wallet
- **Remote signing**: Agent constructs orders → hosted page shows details → user signs in wallet → signature returns to agent
- **SDK**: Uses official `@polymarket/clob-client` TypeScript SDK
- **Chain**: Polygon Mainnet (Chain ID 137)

## MCP Tools

| Tool | Description |
|------|-------------|
| `poly-master-setup` | Configure wallet address + derive API credentials |
| `poly-master-traders` | Discover and browse top traders |
| `poly-master-follow` | Set copy targets, ratios, and risk parameters |
| `poly-master-start` | Start copy-trading monitor |
| `poly-master-pause` | Pause/resume copy trading |
| `poly-master-status` | Current positions, followed traders, system status |
| `poly-master-pnl` | PnL report (day/week/month) |
| `poly-master-risk` | View/modify risk parameters |

## Quick Start

1. User says: "I want to copy trade on Polymarket"
2. Agent guides wallet setup (address + API cred derivation via signing)
3. Agent shows top traders, user picks 1-3
4. Agent starts monitoring — each copy trade sends a signing page link
5. User signs in wallet → trade executes

## Agent Instructions

When user wants to copy trade on Polymarket:

1. **First time setup**: Ask for wallet address → call `setup({ walletAddress })` → confirm CLOB connected
2. **Discover traders**: Call `findTraders()` → present top traders in readable format
3. **Follow traders**: Call `followTrader({ address, copyRatio })` for each selected trader
4. **Configure risk**: Call `manageRisk({ stopLossPercent, maxPositionPerMarket, ... })` based on user preferences
5. **Start**: Call `startCopyTrading()` — monitor starts, signing links auto-sent on new trades
6. **Ongoing**: Use `getStatus()`, `getPnlReport()`, `pauseCopyTrading()` as needed

When presenting trader data, format as a clean list (no tables in Discord/WhatsApp).
When a signing link is generated, send it immediately to the user with clear context.
For risk alerts, relay the notification message directly — it's already formatted.

## Dependencies

- `@polymarket/clob-client` ^5.8.1
- `ethers` ^5.7.2
- `better-sqlite3` for local persistence
- `express` for signing page server

## Files

```
poly-master/
├── SKILL.md              # This file
├── docs/
│   └── quickstart.md     # User-facing quick start guide
├── src/
│   ├── types.ts          # Core type definitions
│   ├── errors.ts         # Error types + retry logic
│   ├── remote-signer.ts  # Zero-custody signing proxy
│   ├── sign-server.ts    # Express server + signing page UI
│   ├── clob.ts           # Polymarket CLOB client wrapper
│   ├── db.ts             # SQLite persistence layer
│   ├── trade-monitor.ts  # Trade monitoring (polling data-api)
│   ├── copy-engine.ts    # Copy trading execution engine
│   ├── risk-engine.ts    # Risk management + position monitoring
│   ├── pnl.ts            # PnL calculation + reporting
│   └── index.ts          # Main entry + MCP tool functions
├── scripts/
│   └── test-clob.ts      # CLOB API connectivity test
├── .internal/
│   └── TECH-RESEARCH.md  # Technical research notes
├── package.json
└── tsconfig.json
```
