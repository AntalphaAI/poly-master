# Poly Master v2 — Quick Start Guide

> Powered by **Antalpha AI**

## What is Poly Master?

Poly Master lets you interact with [Polymarket](https://polymarket.com) — the world's largest prediction market — through natural conversation with your AI agent. You can:

- 📈 **Discover** — Browse trending and new prediction markets
- 💰 **Trade** — Buy/sell Yes or No outcome tokens
- 👥 **Copy-Trade** — Follow top traders and mirror their moves
- 📊 **Track** — Monitor your portfolio and PnL
- 🔮 **Poly Master Hedge** (V2) — LLM-driven near-riskless arbitrage signals

**Zero custody** — your private keys never leave your wallet.

---

## Prerequisites

1. **A crypto wallet** — MetaMask, OKX Wallet, Trust Wallet, or TokenPocket
2. **USDC.e on Polygon** — This is the trading currency on Polymarket
3. **A small amount of POL** — For gas fees on Polygon (< $0.01 per transaction)
4. **Polymarket account** — You must first complete onboarding at [polymarket.com](https://polymarket.com) (this creates your proxy wallet)

---

## Feature 1: Market Discovery

### Browse trending markets

> "What's hot on Polymarket?"

> "Show me trending crypto prediction markets"

The agent returns the top markets ranked by 24h trading volume, with prices for Yes/No outcomes.

### Discover new markets

> "Any new prediction markets in the last 24 hours?"

### Get market details

> "Tell me more about market #3"

---

## Feature 2: Direct Trading

### Buy outcome tokens

> "Buy $20 on Yes for 'Will ETH hit $5000?'"

> "I want to bet $10 on No for market #1"

The agent will:
1. Look up the market and current prices
2. Build the order via MCP
3. Generate a signing page link + QR code
4. You open the link in your wallet browser → review → sign → done!

### Sell outcome tokens

> "Sell my Yes position in the Iran market"

### Check order status

> "Check the status of my last order"

Use `poly-confirm` with the order ID to check signing status + CLOB fill status.

### Browse all orders

> "Show me all my pending orders"

Use `poly-master-orders` to list orders with optional status filter.

### Important notes
- **Market orders**: Buy/sell at current best price (default)
- **Limit orders**: Specify your target price — *"Buy at $0.30/share"*
- **Signing window**: You have **10 minutes** to sign after the link is generated
- **Minimum order**: 5 outcome tokens per order (approx. $1.25+ depending on price)

---

## Feature 3: Poly Master Hedge Strategy (V2)

Poly Master uses LLM reasoning to find near-riskless two-leg hedge opportunities across markets. If "A=YES necessarily implies B=YES", you can buy both legs for totalCost < 1 USDC, locking in profit.

### Signal Tiers

| Tier | Coverage | Risk Level |
|------|----------|------------|
| T1 | ≥ 0.95 | Near-riskless |
| T2 | ≥ 0.90 | Low risk |
| T3 | ≥ 0.85 | Monitor liquidity |

### Scan for opportunities

> "Scan Polymarket for hedge opportunities"

> "Find T1 arbitrage signals"

The agent calls `poly-master-strategy-scan` and returns signals ranked by coverage.

### View signal details

> "Tell me more about signal #1"

Shows both legs (target + cover), prices, liquidity, and LLM reasoning.

### Execute a hedge

> "Execute signal #1 with $5 USDC"

The agent will:
1. Show full signal details for confirmation
2. Generate **two signing links** (target leg first, then cover leg)
3. You sign each leg in order — **must sign leg 1 before leg 2**

### Monitor strategy

> "Show me the Poly Master strategy dashboard"

Displays Tier distribution, signal frequency, slippage cancel rate, and recent scan results.

---

## Feature 4: Copy Trading

### Discover top traders

> "Show me top Polymarket traders"

The agent analyzes recent trading activity and ranks traders by performance.

### Follow a trader

> "Follow trader 0xABC... with 10% copy ratio"

This means: when the trader buys 100 shares, you'll buy 10 shares.

### Set risk controls

> "Set stop loss at 20% and max position at 200 USDC per market"

| Parameter | Default | Description |
|-----------|---------|-------------|
| Stop Loss | 20% | Auto-pause when position drops this much |
| Take Profit | 50% | Alert when position gains this much |
| Max Per Market | $500 | Maximum USDC in any single market |
| Max Total | $2,000 | Maximum daily trading volume |
| Max Slippage | 5% | Reject orders with too much price deviation |

### Monitor performance

> "Show me this week's copy trading PnL"

### Manage following

> "Pause copy trading"

> "Stop following 0xABC..."

---

## Feature 5: Portfolio Tracking

### View positions

> "How's my Polymarket portfolio?"

Shows all current positions with: direction, quantity, average price, current price, market value, and PnL.

### Trade history

> "Show me my recent Polymarket trades"

### PnL reports

> "What's my monthly PnL on Polymarket?"

---

## How Signing Works

Every trade requires your wallet signature (zero custody):

1. 🔔 Agent generates a signing URL
2. 🌐 Open the link in your wallet's built-in browser
3. 🔐 Review the order details (market, direction, price, quantity)
4. ✅ Click "Sign" — your wallet prompts for EIP-712 signature
5. 📤 Signature is submitted, order placed on Polymarket

**Your private key never leaves your wallet.** The agent only receives the signature for the specific order.

**Supported wallet browsers:**
- MetaMask (mobile DApp browser)
- OKX Wallet (Discover tab)
- Trust Wallet (DApp browser)
- TokenPocket (DApp browser)

---

## Troubleshooting

**"CLOB API connection failed"**
→ Check your internet connection. Polymarket may be temporarily down.

**"Sign request expired"**
→ You have **10 minutes** to sign. If it expires, ask the agent to regenerate the signing link.

**"Risk limit exceeded"**
→ Your order exceeds your configured risk parameters. Adjust limits or reduce position size.

**"Not enough balance"**
→ Ensure you have enough USDC.e in your Polymarket proxy wallet. Deposit at [polymarket.com](https://polymarket.com).

**"Minimum order size"**
→ Polymarket requires a minimum of 5 outcome tokens per order.

---

## Support

- **Documentation**: See [SKILL.md](../SKILL.md) for full technical reference
- **Antalpha AI**: [ai.antalpha.com](https://ai.antalpha.com)
- **Polymarket**: [polymarket.com](https://polymarket.com)

---

由 Antalpha AI 提供聚合交易服务 | Powered by [Antalpha AI](https://ai.antalpha.com)
