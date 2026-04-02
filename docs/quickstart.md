# Poly Master — Quick Start Guide

## What is Poly Master?

Poly Master lets you copy-trade top traders on [Polymarket](https://polymarket.com), the world's largest prediction market. Through natural conversation with your AI agent, you can:

- 🔍 Discover profitable traders
- 📋 Copy their trades automatically
- 🛡️ Set risk controls (stop-loss, take-profit, position limits)
- 📊 Track your PnL in real-time

**Zero custody** — your private keys never leave your wallet.

---

## Prerequisites

1. **A crypto wallet** — MetaMask, OKX, Trust Wallet, or TokenPocket
2. **USDC.e on Polygon** — This is the trading currency on Polymarket
3. **A small amount of POL** — For gas fees on Polygon (< $0.01 per transaction)

---

## Step 1: Set Up Your Wallet

Tell your agent:

> "I want to copy trade on Polymarket. My wallet address is 0x..."

The agent will:
1. Configure your wallet address
2. Start the signing server
3. Verify connection to Polymarket

---

## Step 2: Discover Traders

> "Show me top Polymarket traders"

The agent analyzes recent trading activity and shows you the most active and profitable traders, including:
- Trade count and volume
- Number of active markets
- Last activity time

---

## Step 3: Follow a Trader

> "Follow trader 0xABC... with 10% copy ratio"

This means: when the trader buys 100 shares, you'll buy 10 shares.

You can follow multiple traders with different ratios.

---

## Step 4: Set Risk Controls

> "Set stop loss at 20% and max position at 200 USDC per market"

Available risk parameters:
| Parameter | Default | Description |
|-----------|---------|-------------|
| Stop Loss | 20% | Auto-pause when position drops this much |
| Take Profit | 50% | Alert when position gains this much |
| Max Per Market | $100 | Maximum USDC in any single market |
| Max Total | $1,000 | Maximum total portfolio exposure |
| Max Slippage | 2% | Reject orders with price deviation above this |

---

## Step 5: Start Copy Trading

> "Start copy trading"

The agent will:
1. Monitor your followed traders' activity (every 30 seconds)
2. When a trader makes a move, calculate your copy order
3. Send you a **signing link** — click it to approve the trade in your wallet
4. Submit the signed order to Polymarket

---

## How Signing Works

Every copy trade requires your wallet signature:

1. 🔔 Agent sends you a notification with a signing link
2. 🌐 Open the link (works in mobile wallet browsers too)
3. 🔐 Review the order details (market, side, price, size)
4. ✅ Click "Sign Order" — your wallet will prompt for EIP-712 signature
5. 📤 Signature is sent back to the agent, order is submitted

**Your private key never leaves your wallet.** The agent only receives the signature for the specific order.

---

## Managing Your Portfolio

**Check status:**
> "What's my copy trading status?"

**View PnL:**
> "Show me this week's PnL"

**Pause trading:**
> "Pause copy trading"

**Resume:**
> "Resume copy trading"

**Unfollow a trader:**
> "Stop following 0xABC..."

**Change risk settings:**
> "Set stop loss to 30%"

---

## Important Notes

⚠️ **This is not financial advice.** Prediction markets carry risk. Only trade with funds you can afford to lose.

⚠️ **Polymarket availability** may vary by jurisdiction. Users are responsible for ensuring compliance with local regulations.

⚠️ **Copy trading** means your trades mirror someone else's decisions. Past performance does not guarantee future results.

⚠️ **Gas fees** on Polygon are minimal (< $0.01) but you need POL tokens to pay them.

---

## Troubleshooting

**"CLOB API connection failed"**
→ Check your internet connection. Polymarket may be temporarily down.

**"Sign request expired"**
→ You have 5 minutes to sign each order. If it expires, the order is cancelled.

**"Risk limit exceeded"**
→ Your order exceeds your configured risk parameters. Adjust limits or reduce position size.

**"No trades detected"**
→ The trader you're following may be inactive. Check their recent activity.
