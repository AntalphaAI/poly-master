---
name: poly-master
description: "Polymarket prediction market skill by Antalpha AI. Discover trending markets, browse event predictions, invest in outcomes, copy-trade top traders, track portfolio & PnL. Supports wallet signing via hosted pages. Zero custody. Trigger: polymarket, prediction market, 预测市场, poly, copy trade, 跟单, trending predictions, event betting"
metadata: {"mcp":{"url":"https://mcp-skills.ai.antalpha.com/mcp","transport":"streamable-http"},"clawdbot":{"emoji":"🎯"}}
---

# Poly Master — Polymarket Prediction Market

> Powered by **Antalpha AI** — Polymarket 聚合交易与跟单服务

## What it does

Poly Master provides full-stack Polymarket access through natural language:

1. **Market Discovery** — Trending markets, new events, category browsing
2. **Market Analysis** — Prices, volume, liquidity, outcome probabilities
3. **Direct Trading** — Buy/sell outcome tokens with wallet signing
4. **Copy Trading** — Follow top traders, configurable ratios and risk
5. **Portfolio** — Positions, PnL, trade history, open orders
6. **Risk Management** — Stop-loss, take-profit, position limits

## Architecture

```
User ←→ AI Agent ←→ Antalpha MCP Server ←→ Polymarket APIs
                          ↕
                    Signing Page (browser)
                          ↕
                    User's Wallet (MetaMask/OKX/Trust/TokenPocket)
```

- **Zero custody**: Private keys never leave the user's wallet
- **Remote MCP**: `https://mcp-skills.ai.antalpha.com/mcp` (Streamable HTTP)
- **Chain**: Polygon Mainnet (Chain ID 137)
- **Currency**: USDC.e (`0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174`)

## MCP Tools

### Registration (required first)
| Tool | Description |
|------|-------------|
| `antalpha-register` | Register agent, get agent_id + api_key. Call once, persist both. |

### Market Discovery
| Tool | Description | Status |
|------|-------------|--------|
| `poly-trending` | Top markets by 24h volume, optional category filter | 🔜 |
| `poly-new` | Recently created markets (last N hours) | 🔜 |
| `poly-market-info` | Full market details: prices, volume, token IDs, outcomes | 🔜 |

### Direct Trading
| Tool | Description | Status |
|------|-------------|--------|
| `poly-buy` | Buy outcome tokens (market order or limit) | 🔜 |
| `poly-sell` | Sell outcome tokens (full or partial) | 🔜 |
| `poly-confirm` | Confirm pending large orders (>$1K threshold) | 🔜 |
| `poly-order-status` | Check order fill status by orderId | 🔜 |
| `poly-orders` | List recent direct trading orders | 🔜 |

### Copy Trading
| Tool | Description | Status |
|------|-------------|--------|
| `poly-master-traders` | Discover top traders by win rate, volume, ROI | ✅ |
| `poly-master-follow` | Follow/unfollow trader, set copy ratio | ✅ |
| `poly-master-status` | Copy-trading status: followed traders, recent orders | ✅ |
| `poly-master-risk` | View/update risk parameters | ✅ |
| `poly-master-pnl` | PnL report by period, per-trader breakdown | ✅ |
| `poly-master-orders` | List copy-trading orders with status filter | ✅ |

### Portfolio (read-only, no wallet setup needed)
| Tool | Description | Status |
|------|-------------|--------|
| `poly-positions` | Current positions with cost, market value, PnL | 🔜 |
| `poly-history` | Trade history / activity log | 🔜 |
| `poly-open-orders` | Open/pending orders | 🔜 |

### Monitoring
| Tool | Description | Status |
|------|-------------|--------|
| `poly-monitor` | Operational health: API rates, fill rates, alerts | 🔜 |

**Legend**: ✅ = deployed on MCP server | 🔜 = pending deployment

## Agent Instructions

### Portfolio Query (fallback until poly-positions is deployed)

When user asks about Polymarket portfolio/positions/持仓:

1. Get user's proxy wallet address (from memory or ask user)
2. Call Polymarket public API:
   ```
   GET https://data-api.polymarket.com/positions?user={proxy_wallet}
   ```
3. Format response with Antalpha AI branding (see Brand Attribution below)
4. Include: event title, direction (Yes/No), size, avg price, current price, PnL %, market value

### Market Discovery

When user asks about trending/hot predictions or new markets:

1. Call `poly-trending({ limit, category? })` — top by 24h volume
2. Call `poly-new({ limit, hours?, category? })` — recently created
3. Call `poly-market-info({ marketId })` — full details (accepts list index or ID)
4. Categories: "crypto", "politics", "sports", "geopolitics", "finance"
5. Markets cached 5 min; list indices persist within session

### Direct Trading

When user wants to invest in a prediction outcome:

1. Browse first with `poly-trending` or `poly-new`
2. `poly-buy({ marketId, outcome, amountUsdc, price?, slippageTolerance? })`
3. Omit `price` for market order; include for limit order
4. Orders > $1K require `poly-confirm()` before execution
5. `poly-sell({ marketId, outcome, amountPercent })` for partial exit

### Copy Trading

When user wants to follow top traders:

1. `poly-master-traders()` — show top performers
2. `poly-master-follow({ address, copyRatio })` — start following
3. `poly-master-risk({ stopLossPercent, maxPositionPerMarket })` — set limits
4. Monitor: each copy trade sends signing page link to user
5. `poly-master-pnl({ period })` — check performance

### Order Preview Format (mandatory for trading)

```
📋 事件名称
🎯 方向：BUY Yes/No
💰 价格：$X.XX/份
📦 数量：X.XX 份
💵 总计：$X.XX USDC
📊 滑点：X%
🔗 签名页面：<signing_url>
[二维码图片]

由 Antalpha AI 提供聚合交易服务
```

### Portfolio Output Format (mandatory for positions)

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

## Risk Defaults

| Parameter | Default | Description |
|-----------|---------|-------------|
| Slippage Tolerance | 5% | Max price deviation for market orders |
| Daily Bet Limit | $2,000 | Maximum daily trading volume |
| Per-Market Limit | $500 | Maximum per single market |
| Large Order Threshold | $1,000 | Requires explicit confirmation |
| Signing Expiry | 60 seconds | Page shows countdown timer |

## Polymarket SDK Reference

Key parameters for backend development:

- **EIP-712 domain.name**: `"Polymarket CTF Exchange"` (NOT "ClobExchange")
- **signatureType**: `2` (POLY_GNOSIS_SAFE) — users trade via GnosisSafe proxy wallet
- **CLOB Client**: 5th param = signatureType, 6th param = funderAddress (proxy wallet)
- **maker**: proxy wallet address | **signer**: EOA wallet
- **HMAC owner**: API Key (not wallet address)
- **API Key**: `createApiKey()` once only, then `deriveApiKey()`
- **USDC.e (Polygon)**: `0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174`

## Files

```
poly-master/
├── SKILL.md              # This file (agent instructions)
├── README.md             # Project overview
├── docs/
│   └── quickstart.md     # User-facing setup guide
├── references/
│   └── trade-page.html   # Browser signing page template
└── .gitignore
```

## Brand Attribution

Every user-facing output from this skill **must** end with:

- 中文: `由 Antalpha AI 提供聚合服务`
- English: `Powered by Antalpha AI`

This applies to: portfolio reports, market listings, order previews, PnL reports, copy-trading status — all outputs without exception.

---

Built by [Antalpha AI](https://ai.antalpha.com)
