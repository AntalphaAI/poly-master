# 🎯 Poly Master — Polymarket Prediction Market Skill

> **Powered by [Antalpha AI](https://ai.antalpha.com)** — Zero-custody Polymarket aggregated trading & copy-trading for AI agents

[![Version](https://img.shields.io/badge/version-1.0.0-blue)]()
[![MCP](https://img.shields.io/badge/protocol-MCP%202024--11--05-green)]()
[![Chain](https://img.shields.io/badge/chain-Polygon-8247E5)]()
[![License](https://img.shields.io/badge/license-MIT-yellow)]()

---

## What is Poly Master?

Poly Master is an AI agent skill that connects to [Polymarket](https://polymarket.com) — the world's largest prediction market — through the [Antalpha AI MCP Server](https://mcp-skills.ai.antalpha.com). It enables any MCP-compatible AI agent to:

- 📈 **Discover trending prediction markets** — Browse real-time hot markets by 24h volume, filter by category
- 🔍 **Analyze market data** — View prices, liquidity, outcome probabilities, and trading volume
- 💰 **Trade prediction outcomes** — Buy/sell Yes or No tokens with market or limit orders
- 👥 **Copy-trade top traders** — Follow profitable traders with configurable copy ratios
- 📊 **Track portfolio & PnL** — Monitor positions, unrealized gains, and trade history
- 🛡️ **Manage risk** — Built-in stop-loss, take-profit, position limits, and large order confirmation

**🔐 Zero Custody** — Private keys never leave the user's wallet. All transactions are signed in the user's own wallet browser via EIP-712 typed data signatures.

---

## Architecture

```
┌──────────┐     Natural Language      ┌──────────────┐
│   User   │ ◄──────────────────────► │   AI Agent   │
└──────────┘                           └──────┬───────┘
                                              │ MCP Protocol
                                              ▼
                                   ┌─────────────────────┐
                                   │  Antalpha AI MCP     │
                                   │  Server              │
                                   │  (Streamable HTTP)   │
                                   └──────────┬──────────┘
                                              │
                              ┌───────────────┼───────────────┐
                              ▼               ▼               ▼
                     ┌──────────────┐ ┌──────────────┐ ┌────────────┐
                     │  Polymarket  │ │  Signing     │ │  Gamma     │
                     │  CLOB API    │ │  Page        │ │  Markets   │
                     └──────────────┘ └──────┬───────┘ └────────────┘
                                             │
                                             ▼
                                   ┌─────────────────────┐
                                   │  User's Wallet      │
                                   │  MetaMask / OKX /   │
                                   │  Trust / TokenPocket │
                                   └─────────────────────┘
```

---

## Features

### 📈 Market Discovery

| Capability | Description |
|-----------|-------------|
| Trending Markets | Top markets ranked by 24h trading volume |
| New Markets | Recently created prediction events |
| Category Filter | crypto, politics, sports, geopolitics, finance |
| Market Details | Real-time prices, volume, liquidity, outcome token IDs |

**Example:**
> *"What's trending on Polymarket right now?"*
>
> *"Show me new crypto prediction markets from the last 24 hours"*

### 💰 Direct Trading

| Capability | Description |
|-----------|-------------|
| Market Orders | Buy/sell at current best price |
| Limit Orders | Set target price for execution |
| QR Code Signing | Scan to open signing page in wallet browser |
| Multi-Wallet | MetaMask, OKX Wallet, Trust Wallet, TokenPocket |

**Example:**
> *"Buy $50 on Yes for 'Will ETH hit $5000 by July?'"*
>
> *"I want to bet $10 on No"*

### 👥 Copy Trading

| Capability | Description |
|-----------|-------------|
| Trader Discovery | Rank traders by win rate, volume, ROI |
| Configurable Ratio | e.g. 10% = trader buys 100 shares → you buy 10 |
| Multi-Follow | Follow multiple traders simultaneously |
| Auto-Monitor | Checks for new trades every 30 seconds |

**Example:**
> *"Show me top Polymarket traders"*
>
> *"Follow 0xABC... at 10% copy ratio"*

### 📊 Portfolio & PnL

| Capability | Description |
|-----------|-------------|
| Position Tracking | Current holdings with cost basis and market value |
| PnL Reports | By period (day/week/month) with per-trader breakdown |
| Trade History | Complete log of all trades with timestamps |
| Open Orders | Pending orders awaiting fill |

**Example:**
> *"How's my Polymarket portfolio?"*
>
> *"Show me this week's PnL"*

### 🛡️ Risk Management

| Parameter | Default | Range |
|-----------|---------|-------|
| Slippage Tolerance | 5% | 0.1% – 20% |
| Daily Volume Limit | $2,000 | $10 – $100,000 |
| Per-Market Limit | $500 | $1 – $50,000 |
| Large Order Threshold | $1,000 | Requires explicit confirmation |
| Stop-Loss (copy trading) | 20% | 1% – 99% |
| Take-Profit (copy trading) | 50% | 1% – 999% |

---

## Quick Start

### Prerequisites

1. **A crypto wallet** — MetaMask, OKX, Trust Wallet, or TokenPocket
2. **USDC.e on Polygon** — Trading currency on Polymarket
3. **Small amount of POL** — For gas fees (< $0.01 per tx)
4. **Polymarket account** — Must complete onboarding at [polymarket.com](https://polymarket.com) first

### Install

```bash
# Using ClawHub CLI
clawhub install poly-master

# Or manually copy to your agent's skills directory
```

### Usage

Simply talk to your AI agent:

```
👤 "What's hot on Polymarket?"
🤖 Shows trending markets with prices and volumes

👤 "Buy $20 on Yes for the top market"
🤖 Generates order + signing link + QR code

👤 "Show me top traders to copy"
🤖 Lists profitable traders ranked by performance

👤 "Follow that trader at 5% ratio"
🤖 Starts monitoring and mirroring trades
```

---

## MCP Server

| Property | Value |
|----------|-------|
| **Endpoint** | `https://mcp-skills.ai.antalpha.com/mcp` |
| **Protocol** | Streamable HTTP (MCP 2024-11-05) |
| **Auth** | Call `antalpha-register` tool to get `agent_id` + `api_key` |
| **Tools** | 20+ MCP tools for market data, trading, copy-trading, portfolio |

### Integration for External Agents

Any MCP-compatible agent can integrate Poly Master:

1. Connect to the MCP server endpoint
2. Call `antalpha-register` to obtain credentials
3. Use MCP tools as documented in [SKILL.md](./SKILL.md)
4. Handle signing URLs by presenting them to the end user

---

## How Signing Works

```
Agent                    MCP Server              Signing Page            User Wallet
  │                         │                        │                      │
  │── poly-buy ────────────►│                        │                      │
  │                         │── build order ────────►│                      │
  │◄── { signUrl } ────────│                        │                      │
  │                         │                        │                      │
  │── present signUrl ──────────────────────────────►│                      │
  │                         │                        │── eth_signTypedData ─►│
  │                         │                        │◄── signature ────────│
  │                         │◄── submit signature ──│                      │
  │                         │── place order on CLOB  │                      │
  │◄── order confirmation ──│                        │                      │
```

**Security Guarantees:**
- ✅ Private keys never leave the wallet
- ✅ Each signature is bound to specific order data (EIP-712)
- ✅ Signing page shows full order details before signature
- ✅ Links expire after 60 seconds
- ✅ No backend custody of funds or keys

---

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Chain | Polygon Mainnet (Chain ID 137) |
| Currency | USDC.e |
| Market Protocol | Polymarket CTF Exchange (Conditional Token Framework) |
| SDK | [@polymarket/clob-client](https://github.com/Polymarket/clob-client) v5.8.1 |
| Signing | EIP-712 Typed Data via browser |
| Wallet Type | GnosisSafe (1/1) Proxy Wallet |
| MCP Protocol | Streamable HTTP (MCP 2024-11-05) |
| Backend | NestJS 11 + TypeORM + MySQL + Redis |

---

## Important Disclaimers

⚠️ **Not financial advice.** Prediction markets carry risk. Only trade with funds you can afford to lose.

⚠️ **Polymarket availability** may vary by jurisdiction. Users are responsible for compliance with local regulations.

⚠️ **Copy trading** mirrors another trader's decisions. Past performance does not guarantee future results.

⚠️ **Gas fees** on Polygon are minimal (< $0.01) but require POL tokens.

---

## Documentation

- [SKILL.md](./SKILL.md) — Full agent instructions, MCP tool reference, output format specs
- [docs/quickstart.md](./docs/quickstart.md) — User-facing setup guide

---

## License

MIT

---

**Built by [Antalpha AI](https://ai.antalpha.com)** 🎯

*Powering the next generation of AI-driven prediction market trading.*
