# Poly Master — Polymarket Prediction Market

🎯 Full-stack Polymarket access: discover markets, invest in predictions, copy-trade top traders, track your portfolio.

**Zero custody** — private keys never leave your wallet.

## Features

| Feature | Description |
|---------|-------------|
| 📈 Market Discovery | Trending markets, new events, category browsing |
| 💰 Direct Trading | Buy/sell outcome tokens with wallet signing |
| 👥 Copy Trading | Follow top traders, configurable ratios |
| 📊 Portfolio & PnL | Positions, trade history, performance reports |
| 🛡️ Risk Management | Stop-loss, take-profit, position limits |

## Architecture

```
User ←→ AI Agent ←→ Antalpha MCP Server ←→ Polymarket APIs
                          ↕
                    Browser Signing Page
                          ↕
                    User's Wallet (MetaMask/OKX/Trust/TokenPocket)
```

## Quick Start

Tell your AI agent:

> "看看 Polymarket 上有什么热门预测"

> "Show me trending prediction markets"

> "我想投 $10 赌 Yes"

> "帮我看看我的 Polymarket 持仓"

See [docs/quickstart.md](docs/quickstart.md) for full setup guide.

## MCP Server

This skill connects to the Antalpha MCP Server:
- **Endpoint**: `https://mcp-skills.ai.antalpha.com/mcp`
- **Protocol**: Streamable HTTP (MCP 2024-11-05)
- **Auth**: `antalpha-register` → get `agent_id` + `api_key`

## Tech Stack

- **Chain**: Polygon Mainnet (Chain ID 137)
- **Currency**: USDC.e
- **SDK**: [@polymarket/clob-client](https://github.com/Polymarket/clob-client) v5.8.1
- **Signing**: EIP-712 typed data via browser page (zero custody)

## License

MIT

---

Built by [Antalpha AI](https://ai.antalpha.com)
