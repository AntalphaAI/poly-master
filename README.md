# Poly Master — Polymarket Copy Trading

🎯 Follow top prediction market traders and automatically copy their positions.

## Features

- **Trader Discovery** — Browse top performers by win rate, ROI, and trade volume
- **Copy Trading** — Configurable copy ratios and aggregation windows
- **Risk Management** — Stop-loss, take-profit, position limits, max slippage
- **PnL Reporting** — Daily/weekly/monthly reports with per-trader breakdown
- **Zero Custody** — Private keys never leave the user's wallet

## Architecture

```
User ←→ AI Agent ←→ MCP Tools ←→ Polymarket CLOB API
                          ↕
                  Signing Server (Express)
                          ↕
                  User's Wallet (MetaMask/OKX/Trust/TokenPocket)
```

## MCP Tools

| Tool | Description |
|------|-------------|
| `poly-master-setup` | Configure wallet + derive API credentials |
| `poly-master-traders` | Discover top traders |
| `poly-master-follow` | Set copy targets and ratios |
| `poly-master-start` | Start copy-trading monitor |
| `poly-master-pause` | Pause/resume copy trading |
| `poly-master-status` | Current positions and system status |
| `poly-master-pnl` | PnL report (day/week/month) |
| `poly-master-risk` | View/modify risk parameters |

## Quick Start

```bash
npm install
npm run build
```

See [docs/quickstart.md](docs/quickstart.md) for full setup guide.

## Tech Stack

- [Polymarket CLOB Client](https://github.com/Polymarket/clob-client) v5.8.1
- ethers v5 (Polygon Mainnet, Chain 137)
- Express (signing page server)
- better-sqlite3 (local persistence)

## License

MIT

---

Built by [Antalpha AI](https://ai.antalpha.com)
