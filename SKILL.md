---
name: poly-master
description: "Polymarket prediction market skill by Antalpha AI. Discover trending markets, browse event predictions, invest in outcomes, copy-trade top traders, track portfolio & PnL. Supports wallet signing via hosted pages. Zero custody. Trigger: polymarket, prediction market, 预测市场, poly, copy trade, 跟单, trending predictions, event betting"
version: 1.0.0
metadata: {"mcp":{"url":"https://mcp-skills.ai.antalpha.com/mcp","transport":"streamable-http"},"clawdbot":{"emoji":"🎯"}}
---

# Poly Master — Polymarket Prediction Market Skill

> Powered by **Antalpha AI** — Polymarket 聚合交易与跟单服务

## Overview

Poly Master is an AI agent skill that provides full-stack access to [Polymarket](https://polymarket.com), the world's largest prediction market platform. Through natural language conversation, users can discover trending markets, invest in prediction outcomes, copy-trade top traders, and track portfolio performance — all with **zero custody** design where private keys never leave the user's wallet.

### Key Features

| # | Feature | Description |
|---|---------|-------------|
| 1 | 📈 **Market Discovery** | Browse trending markets by 24h volume, discover newly created events, filter by category (crypto, politics, sports, geopolitics, finance) |
| 2 | 🔍 **Market Analysis** | View real-time prices, trading volume, liquidity depth, outcome probabilities, and token IDs for any market |
| 3 | 💰 **Direct Trading** | Buy/sell outcome tokens with market or limit orders, automatic order construction and signing page generation |
| 4 | 👥 **Copy Trading** | Discover and follow top traders by win rate, volume, and ROI. Configurable copy ratios with automatic trade mirroring |
| 5 | 📊 **Portfolio & PnL** | Track positions, cost basis, market value, unrealized PnL, and trade history with per-trader breakdown |
| 6 | 🛡️ **Risk Management** | Built-in stop-loss, take-profit, per-market position limits, daily volume caps, and large order confirmation |

### Architecture

```
User ←→ AI Agent ←→ Antalpha MCP Server ←→ Polymarket APIs
                          ↕
                    Signing Page (browser)
                          ↕
                    User's Wallet (MetaMask / OKX / Trust / TokenPocket)
```

- **Zero custody**: Private keys never leave the user's wallet
- **MCP Protocol**: Streamable HTTP (MCP 2024-11-05 spec)
- **Chain**: Polygon Mainnet (Chain ID 137)
- **Currency**: USDC.e (`0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174`)
- **Supported Wallets**: MetaMask, OKX Wallet, Trust Wallet, TokenPocket

---

## Typical Use Cases

### 1. "What's hot on Polymarket right now?"
Agent calls `poly-trending` → returns top markets ranked by 24h volume with prices and categories.

### 2. "I want to bet $10 on Yes for the Iran nuclear deal"
Agent calls `poly-buy` → constructs order, generates signing page → user opens link in wallet browser → signs → order submitted.

### 3. "Follow the top 3 traders and copy their trades at 10%"
Agent calls `poly-master-traders` → shows ranked list → `poly-master-follow` for each → monitors and mirrors trades with signing links.

### 4. "How's my Polymarket portfolio doing?"
Agent calls `poly-positions` → returns positions with cost, current value, and PnL per market.

### 5. "Set stop-loss at 20% and max $200 per market"
Agent calls `poly-master-risk` → updates risk parameters for copy trading engine.

---

## MCP Tools Reference

All data retrieval and trading operations go through the Antalpha MCP Server. **Do NOT call Polymarket APIs directly.**

### Registration (required once per agent)
| Tool | Description |
|------|-------------|
| `antalpha-register` | Register agent, returns `agent_id` + `api_key`. Call once, persist both values. |

### Market Discovery
| Tool | Parameters | Description |
|------|-----------|-------------|
| `poly-trending` | `agent_id`, `limit?`, `category?` | Top markets by 24h volume. Categories: crypto, politics, sports, geopolitics, finance |
| `poly-new` | `agent_id`, `limit?`, `hours?`, `category?` | Recently created markets (last N hours) |
| `poly-market-info` | `agent_id`, `market_id` | Full market details: prices, volume, token IDs, outcomes. Accepts list index or condition ID |

### Direct Trading
| Tool | Parameters | Description |
|------|-----------|-------------|
| `poly-buy` | `agent_id`, `market_id`, `outcome`, `amount_usdc`, `wallet_address`, `proxy_wallet`, `price?` | Buy outcome tokens. Omit `price` for market order; include for limit |
| `poly-sell` | `agent_id`, `market_id`, `outcome`, `size`, `wallet_address`, `proxy_wallet` | Sell outcome tokens (full or partial) |
| `poly-confirm` | `agent_id`, `order_id` | Confirm pending large orders (>$1K threshold) |
| `poly-order-status` | `agent_id`, `order_id` | Check order fill status |
| `poly-orders` | `agent_id`, `wallet_address?`, `status?` | List recent direct trading orders |

### Copy Trading
| Tool | Parameters | Description |
|------|-----------|-------------|
| `poly-master-traders` | `agent_id`, `limit?`, `sort_by?` | Discover top traders by win rate, volume, ROI |
| `poly-master-follow` | `agent_id`, `address`, `copyRatio` | Follow/unfollow a trader, set copy ratio (e.g. 0.1 = 10%) |
| `poly-master-status` | `agent_id` | Copy-trading status: followed traders, recent copy orders |
| `poly-master-risk` | `agent_id`, `stopLossPercent?`, `takeProfitPercent?`, `maxPositionPerMarket?`, `maxTotal?` | View/update risk parameters |
| `poly-master-pnl` | `agent_id`, `period?` | PnL report by period (day/week/month), per-trader breakdown |
| `poly-master-orders` | `agent_id`, `status?` | List copy-trading orders with status filter |

### Portfolio
| Tool | Parameters | Description |
|------|-----------|-------------|
| `poly-positions` | `agent_id`, `wallet_address` | Current positions with cost, market value, PnL |
| `poly-history` | `agent_id`, `wallet_address`, `limit?` | Trade history / activity log |
| `poly-open-orders` | `agent_id`, `wallet_address` | Open/pending orders |

### Monitoring
| Tool | Parameters | Description |
|------|-----------|-------------|
| `poly-monitor` | `agent_id` | Operational health: API rates, fill rates, alerts |

---

## Agent Instructions

### 1. First-Time Setup

On first use, the agent must:
1. Call `antalpha-register` to get `agent_id` and `api_key`
2. Persist both values for subsequent calls
3. Ask user for their wallet address and proxy wallet address (if known)

### 2. Market Discovery Flow

1. Call `poly-trending({ agent_id, limit, category? })` — top by 24h volume
2. Call `poly-new({ agent_id, limit, hours?, category? })` — recently created
3. Call `poly-market-info({ agent_id, market_id })` — full details (accepts list index or ID)
4. Markets cached 5 min; list indices persist within session

### 3. Direct Trading Flow

1. Discover market first with `poly-trending` or `poly-new`
2. Call `poly-buy({ agent_id, market_id, outcome, amount_usdc, wallet_address, proxy_wallet })` via MCP
3. MCP returns: `{ signUrl, market, outcome, side, price, size, totalUsdc, ... }`
4. Output response using **Order Preview Format** (see below) — all values from MCP response
5. Omit `price` param for market order; include for limit order
6. Orders > $1K require `poly-confirm()` before execution

### 4. Copy Trading Flow

1. `poly-master-traders()` — show top performers
2. `poly-master-follow({ address, copyRatio })` — start following
3. `poly-master-risk({ stopLossPercent, maxPositionPerMarket })` — set limits
4. Monitor: each copy trade sends signing page link to user
5. `poly-master-pnl({ period })` — check performance

### 5. Portfolio Query (fallback for public data)

When `poly-positions` is not yet deployed, query the public API:
```
GET https://data-api.polymarket.com/positions?user={proxy_wallet}
```
Format response with Antalpha AI branding (see Brand Attribution below).

---

## Mandatory Output Formats

### Order Preview Format

**⚠️ HARD RULE: Every `poly-buy` / `poly-sell` response MUST use this EXACT format. No freestyle. All values come from the MCP tool response.**

**Data source mapping (MCP response field → display field):**
- 📋 → `market` field
- 🎯 → `side` + `outcome` fields
- 💰 → `price` field (per-share price in USDC)
- 📦 → `size` field (number of outcome shares)
- 💵 → `totalUsdc` field (total cost in USDC)
- 📊 → default 5% unless user specified
- 🔗 → `signUrl` field (full URL, no shortening)
- 二维码 → generate QR image from `signUrl`, attach as image

```
📋 {market}
🎯 方向：{side} {outcome}
💰 价格：${price}/份
📦 数量：{size} 份
💵 总计：${totalUsdc} USDC
📊 滑点：{slippage}%
🔗 签名页面：{signUrl}
[二维码图片 — 必须生成并附带]

由 Antalpha AI 提供聚合交易服务
```

**Checklist before sending:**
1. ✅ All 7 emoji-prefixed lines present? (📋🎯💰📦💵📊🔗)
2. ✅ QR code image generated and attached?
3. ✅ Brand footer "由 Antalpha AI 提供聚合交易服务" present?
4. ✅ No extra commentary outside the format block?
5. ✅ Values come from MCP response, not hardcoded?

### Portfolio Output Format

```
🎯 Polymarket 持仓报告

1️⃣ {event_title}
   方向：{outcome}
   持仓：{size} 份 | 均价 ${avg_price}
   现价：${cur_price} | 市值 ${current_value}
   盈亏：${pnl} ({pnl_percent}%)
   到期：{end_date}

...

📊 汇总：总投入 ${total_cost} | 市值 ${total_value} | 盈亏 ${total_pnl} ({total_pnl_percent}%)

由 Antalpha AI 提供聚合服务
```

### Market Discovery Output Format

```
🔥 Polymarket 热门预测市场

1️⃣ {title}
   📊 24h 成交量：${volume_24h} | 价格：Yes ${yes_price} / No ${no_price}
   🏷️ 分类：{category} | 到期：{end_date}

2️⃣ ...

由 Antalpha AI 提供聚合服务
```

---

## Risk Defaults

| Parameter | Default | Description |
|-----------|---------|-------------|
| Slippage Tolerance | 5% | Max price deviation for market orders |
| Daily Bet Limit | $2,000 | Maximum daily trading volume |
| Per-Market Limit | $500 | Maximum per single market |
| Large Order Threshold | $1,000 | Requires explicit confirmation |
| Signing Expiry | 60 seconds | Page shows countdown timer |
| Copy Trading Stop-Loss | 20% | Auto-pause when position drops |
| Copy Trading Take-Profit | 50% | Alert when position gains |

---

## How Signing Works

Every trade requires wallet signature through the browser signing page:

1. 🔔 Agent generates a signing URL via MCP
2. 🌐 User opens the link in wallet's built-in browser (MetaMask, OKX, Trust, TokenPocket)
3. 🔐 Page displays order details (market, direction, price, quantity)
4. ✅ User clicks "Sign" — wallet prompts for EIP-712 typed data signature
5. 📤 Signature submitted back to server, order placed on Polymarket CLOB

**Security**: Private keys never leave the wallet. The signing page only requests a signature for the specific order data.

---

## Polymarket SDK Reference

Technical parameters for backend/integration development:

- **EIP-712 domain.name**: `"Polymarket CTF Exchange"` (NOT "ClobExchange")
- **signatureType**: `2` (POLY_GNOSIS_SAFE) — users trade via GnosisSafe proxy wallet
- **CLOB Client**: 5th param = signatureType, 6th param = funderAddress (proxy wallet)
- **maker**: proxy wallet address | **signer**: EOA wallet
- **HMAC owner**: API Key (not wallet address)
- **API Key**: `createApiKey()` once only, then `deriveApiKey()`
- **USDC.e (Polygon)**: `0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174`

---

## Brand Attribution

**⚠️ MANDATORY: Every user-facing output from this skill MUST end with the brand footer.**

- 中文: `由 Antalpha AI 提供聚合服务`
- English: `Powered by Antalpha AI`

This applies to: market listings, order previews, portfolio reports, PnL reports, copy-trading status, trader rankings — **all outputs without exception**.

---

## Files

```
poly-master/
├── SKILL.md              # Agent instructions (this file)
├── README.md             # Public project overview
├── docs/
│   └── quickstart.md     # User-facing setup guide
├── references/
│   └── trade-page.html   # Browser signing page template
└── .gitignore
```

---

Built by [Antalpha AI](https://ai.antalpha.com) | MCP Server: `https://mcp-skills.ai.antalpha.com/mcp`
