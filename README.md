# 🎯 Poly Master — Polymarket Prediction Market Skill

> **Powered by [Antalpha AI](https://ai.antalpha.com)** — Zero-custody Polymarket aggregated trading & copy-trading for AI agents

[![Version](https://img.shields.io/badge/version-2.0.0-blue)]()
[![MCP](https://img.shields.io/badge/protocol-MCP%202024--11--05-green)]()
[![Chain](https://img.shields.io/badge/chain-Polygon-8247E5)]()
[![License](https://img.shields.io/badge/license-MIT-yellow)]()

---

[🇺🇸 English](#english) · [🇨🇳 中文](#chinese)

---

<a name="english"></a>

## What is Poly Master?

Poly Master is an AI agent skill that connects to [Polymarket](https://polymarket.com) — the world's largest prediction market — through the [Antalpha AI MCP Server](https://mcp-skills.ai.antalpha.com). It enables any MCP-compatible AI agent to:

- 📈 **Discover trending prediction markets** — Browse real-time hot markets by 24h volume, filter by category
- 🔍 **Analyze market data** — View prices, liquidity, outcome probabilities, and trading volume
- 💰 **Trade prediction outcomes** — Buy/sell Yes or No tokens with market or limit orders
- 👥 **Copy-trade top traders** — Follow profitable traders with configurable copy ratios
- 📊 **Track portfolio & PnL** — Monitor positions, unrealized gains, and trade history
- 🛡️ **Manage risk** — Built-in stop-loss, take-profit, position limits, and large order confirmation
- 🔮 **Poly Master Hedge Strategy (V2)** — LLM-driven logical implication arbitrage, T1/T2/T3 tiered signals
- 🏗️ **Powered by Polymarket Builder Program (V2)** — Orders are routed through the Polymarket Builder Program for optimal execution and liquidity

**🔐 Zero Custody** — Private keys never leave the user's wallet. All transactions are signed in the user's own wallet browser via EIP-712 typed data signatures.

---

## Why V2? — Poly Master Strategy

> **The core insight**: Most prediction market tools help you pick winners. Poly Master finds situations where *you don't need to pick* — because logic guarantees the outcome.

### The Problem with Traditional Prediction Market Trading

Traditional approaches require directional bets: you win only if your prediction is correct. Market sentiment, information asymmetry, and emotional bias all work against you.

### Poly Master's Approach: Logical Implication Arbitrage

Poly Master uses LLM reasoning to identify **logical implication relationships** between markets — not statistical correlation.

**The principle:** If Event A happening *necessarily implies* Event B will happen, and the market hasn't priced this relationship correctly, you can buy both positions for a **combined cost under $1.00 USDC** and lock in a guaranteed profit regardless of the actual outcome.

```
Example:
  Market A: "Will Iran sign a ceasefire by April 30?"  → Yes @ $0.20
  Market B: "Will the Strait of Hormuz reopen by May?" → Yes @ $0.70

  Logical implication: Iran ceasefire → Hormuz reopens (high confidence)
  Total cost: $0.20 + $0.70 = $0.90 < $1.00
  Guaranteed profit: $0.10 per $1 deployed (11.1% return)
```

### Why This Works

| Traditional Trading | Poly Master Strategy |
|--------------------|-----------------|
| Requires predicting outcomes | Exploits logical inconsistencies |
| Win rate depends on market knowledge | Profit locked in at entry |
| Exposed to sentiment swings | Protected by logical structure |
| One-sided risk | Near-symmetric protection |
| Manual research | LLM scans hundreds of markets automatically |

### Signal Tiers

| Tier | Coverage Score | Risk Level | Description |
|------|---------------|------------|-------------|
| **T1** | ≥ 0.95 | 🟢 Near-riskless | LLM has extremely high confidence in the logical implication. Rare but highest quality. |
| **T2** | ≥ 0.90 | 🟡 Low risk | Strong implication with minor edge cases. Most common actionable signals. |
| **T3** | ≥ 0.85 | 🟠 Moderate | Reasonable implication, but monitor liquidity and position size. |

### Use Cases

**📍 Scenario 1: Geopolitical Chains**
When one event (ceasefire, election result, regime change) logically triggers a cascade of related outcomes, Poly Master identifies which downstream markets are mispriced relative to the upstream event.

**📍 Scenario 2: Sports & Tournament Brackets**
If Team A winning the semifinal is already priced at 80%, but their path to the final implies 90% likelihood of another outcome, the gap is exploitable.

**📍 Scenario 3: Regulatory / Policy Cascades**
A policy decision (e.g., Fed rate cut) logically affects multiple downstream markets (mortgage rates, housing, crypto). Poly Master finds the mispriced links.

**📍 Scenario 4: Passive Alpha Generation**
Run `poly-master-strategy-scan` daily. Collect T1/T2 signals when available. Execute small positions ($1–$10) consistently. Compound low-risk returns without directional exposure.

### Key Advantages

- 🧠 **LLM-powered reasoning** — not rule-based, not correlation-based; genuine semantic understanding of causal relationships
- ⚡ **Automated scanning** — monitors all active Polymarket events continuously, surfaces only actionable signals
- 🔒 **Structural edge** — profit is baked in at entry when totalCost < 1.0; no need to predict future outcomes
- 💧 **Liquidity-aware** — signals are filtered by available order book depth; no phantom opportunities
- 🎯 **Tiered confidence** — T1/T2/T3 scoring lets you choose your risk tolerance
- 🔐 **Zero custody** — all execution stays in your wallet; Poly Master only generates the signing links

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
| Trade History | On-chain history via `poly-history` |
| Order List | All orders with status filter via `poly-master-orders` |

**Example:**
> *"How's my Polymarket portfolio?"*
>
> *"Show me this week's PnL"*

### 🔮 Poly Master Hedge Strategy (V2)

| Tier | Coverage | Description |
|------|----------|-------------|
| T1 | ≥ 0.95 | Near-riskless — profit locked at entry |
| T2 | ≥ 0.90 | Low risk — strong logical implication |
| T3 | ≥ 0.85 | Moderate — check liquidity before executing |

**Example conversations:**
> *"Scan for arbitrage opportunities on Polymarket"*
>
> *"Show me T1 signals only"*
>
> *"Execute signal #2 with $5 USDC"*
>
> *"What's the Poly Master strategy dashboard showing?"*

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

Install directly from GitHub:

```bash
openclaw skill install https://github.com/AntalphaAI/poly-master
```

Or install via OpenClaw chat:

```
"Install Poly Master skill"
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
| **Tools** | 30+ MCP tools for market data, trading, copy-trading, portfolio, hedge strategy |

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
- ✅ Links expire after 10 minutes
- ✅ No backend custody of funds or keys

---

## MCP Tools Reference (v2)

| Tool | Description |
|------|-------------|
| `antalpha-register` | Register agent, get `agent_id` + `api_key` |
| `poly-trending` | Trending markets by 24h volume |
| `poly-new` | Recently created markets |
| `poly-market-info` | Full market details |
| `poly-buy` | Buy outcome tokens (market/limit) |
| `poly-sell` | Sell outcome tokens |
| `poly-confirm` | Check order signing + CLOB fill status |
| `poly-positions` | Current holdings |
| `poly-history` | On-chain trade history |
| `poly-master-orders` | Order list with status filter |
| `poly-master-traders` | Top traders ranked by performance |
| `poly-master-follow` | Follow/unfollow a trader |
| `poly-master-status` | Copy-trading status |
| `poly-master-risk` | View/update risk parameters |
| `poly-master-pnl` | PnL report by period |
| `poly-master-strategy-scan` | Scan for hedge signals |
| `poly-master-strategy-signal` | Get signal details |
| `poly-master-strategy-execute` | Execute two-leg hedge order |
| `poly-master-strategy-metrics` | Strategy dashboard |
| `poly-master-strategy-dry-run` | Toggle dry-run mode |

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
- [docs/quickstart.md](./docs/quickstart.md) — User-facing setup guide (v2 updated)

---

## License

MIT © [Antalpha AI Team](https://www.antalpha.com/)

---

**Built by [Antalpha AI](https://ai.antalpha.com)** 🎯 | v2.0.0

*Powering the next generation of AI-driven prediction market trading.*

---

<a name="chinese"></a>

## Poly Master 是什么？

Poly Master 是一个 AI Agent 技能，通过 [Antalpha AI MCP Server](https://mcp-skills.ai.antalpha.com) 接入 [Polymarket](https://polymarket.com)——全球最大的预测市场平台。任何兼容 MCP 协议的 AI Agent 均可通过它实现：

- 📈 **发现热门预测市场** — 按 24h 成交量浏览实时热门市场，支持分类筛选
- 🔍 **分析市场数据** — 查看实时价格、流动性、结果概率和交易量
- 💰 **交易预测结果** — 市价单或限价单买卖 Yes/No Token
- 👥 **跟单顶级交易员** — 跟随盈利交易员，可设置跟单比例
- 📊 **追踪持仓与盈亏** — 实时监控仓位、浮盈浮亏及交易历史
- 🛡️ **风险管理** — 内置止损、止盈、单市场仓位上限及大单确认机制
- 🔮 **Poly Master 对冲策略（V2）** — LLM 驱动的逻辑蕴含套利，T1/T2/T3 分级信号
- 🏗️ **接入 Polymarket Builder Program（V2）** — 订单通过 Polymarket Builder Program 路由，享受更优执行和流动性

**🔐 零托管** — 私钥永不离开用户钱包。所有交易通过用户自己钱包浏览器内的 EIP-712 类型数据签名完成。

---

## 为什么选择 V2？Poly Master 策略详解

> **核心洞察**：多数预测市场工具要求你猜对结果。Poly Master 进一步——它寻找那些你根本 *不需要猜* 的场景，因为逻辑已经决定了结果。

### 传统预测市场交易的痛点

传统方式需要单向投注：你只有在预测正确时才能赢利。市场情绪、信息不对称和认知偏差都在与你作对。

### Poly Master 的方法：逻辑蕴含套利

Poly Master 利用 LLM 推理识别市场间的**逻辑蕴含关系**——而非统计相关性。

**原理：** 如果事件 A 发生*必然导致*事件 B 发生，且市场尚未正确定价这一关系，就可以同时买入两个仓位，**总成本不足 1 USDC**，锁定保底收益。

```
示例：
  市场 A：“伊朗将在 4 月底前签署停火协议？”  → Yes @ $0.20
  市场 B：“霍尔木兹海峡 5 月前恢复正常？” → Yes @ $0.70

  逻辑蕴含：伊朗停火 → 海峡恢复（高置信）
  总成本：$0.20 + $0.70 = $0.90 < $1.00
  保底收益：$0.10 / 每 USDC（11.1% 回报）
```

### 为什么有效

| 传统交易 | Poly Master 策略 |
|----------|--------------|
| 需要预测结果 | 利用市场定价错误 |
| 胜率取决于市场判断 | 入场即锁定收益 |
| 暴露于情绪波动 | 由逻辑结构保护 |
| 单向风险 | 近似对称保护 |
| 人工调研 | LLM 自动扫描数百个事件 |

### 信号分级

| 分级 | 覆盖率 | 风险等级 | 说明 |
|------|--------|-----------|------|
| **T1** | ≥ 0.95 | 🟢 几乎无风险 | LLM 对逻辑蕴含关系置信极高，稀有但质量最高 |
| **T2** | ≥ 0.90 | 🟡 低风险 | 强蕴含关系，少量边界情况，最常见的可操作信号 |
| **T3** | ≥ 0.85 | 🟠 中等 | 合理蕴含关系，注意流动性和仓位大小 |

### 使用场景

**📍 场景一：地缘政治连锁效应**
停火、选举结果、政权变化等事件经常引发一系列下游市场的定价失调。Poly Master 定位其中被错误定价的下游市场。

**📍 场景二：体育赛事与比赛路径**
如果 A 队已继续事在八亝，但其死少路径意味着另一个市场的概率应为 90%，这个差距就是套利机会。

**📍 场景三：监管政策连锁**
一项政策决定（如美联储降息）逻辑上影响多个下游市场。Poly Master 寻找定价失调的关联市场。

**📍 场景四：被动生成 Alpha**
每天运行 `poly-master-strategy-scan`，稳定收集 T1/T2 信号，每次戩5–10 USDC小仓位。无需方向判断，复利兴利就是超额收益。

### V2 核心优势

- 🧠 **LLM 语义推理** — 非规则、非相关性；真正理解因果关系
- ⚡ **自动扫描** — 持续监控全市场活跃事件，只呈现可操作信号
- 🔒 **结构性优势** — totalCost < 1.0 时收益在入场时就已确定
- 💧 **流动性感知** — 信号已将盘口深度纳入考量，无虚假机会
- 🎯 **分级置信** — T1/T2/T3 评分，按自身风险偏好选择
- 🔐 **零托管** — 所有执行在钱包内完成，Poly Master 只生成签名链接

---

## 架构图

```
┌──────┐    自然语言    ┌──────────┐
│ 用户 │ ◄──────────► │ AI Agent │
└──────┘               └────┬─────┘
                             │ MCP 协议
                             ▼
                  ┌──────────────────────┐
                  │  Antalpha AI MCP     │
                  │  Server              │
                  │  (Streamable HTTP)   │
                  └──────────┬───────────┘
                             │
             ┌───────────────┼───────────────┐
             ▼               ▼               ▼
    ┌──────────────┐ ┌──────────────┐ ┌────────────┐
    │  Polymarket  │ │   签名页面   │ │   Gamma    │
    │  CLOB API    │ │  (浏览器)    │ │  Markets   │
    └──────────────┘ └──────┬───────┘ └────────────┘
                            │
                            ▼
                  ┌─────────────────────┐
                  │     用户钱包        │
                  │  MetaMask / OKX /   │
                  │  Trust / TokenPocket │
                  └─────────────────────┘
```

---

## 功能概览

### 📈 市场发现

| 功能 | 说明 |
|------|------|
| 热门市场 | 按 24h 交易量排名的热门市场 |
| 新市场 | 最近创建的预测事件 |
| 分类筛选 | 加密货币、政治、体育、地缘政治、金融 |
| 市场详情 | 实时价格、成交量、流动性、结果 Token ID |

**示例对话：**
> *"现在 Polymarket 上什么最热门？"*
>
> *"过去 24 小时有哪些新的加密货币预测市场？"*

### 💰 直接交易

| 功能 | 说明 |
|------|------|
| 市价单 | 以当前最优价格买卖 |
| 限价单 | 设定目标价格等待成交 |
| 二维码签名 | 扫码在钱包浏览器中打开签名页面 |
| 多钱包支持 | MetaMask、OKX Wallet、Trust Wallet、TokenPocket |

**示例对话：**
> *"用 50 USDC 买 'ETH 7 月前能到 5000 美元吗？' 的 Yes"*
>
> *"我想用 10 USDC 押 No"*

### 👥 跟单交易

| 功能 | 说明 |
|------|------|
| 发现交易员 | 按胜率、成交量、ROI 排名顶级交易员 |
| 可配置跟单比例 | 例如 10% = 对方买 100 份 → 你买 10 份 |
| 多人跟单 | 同时跟随多位交易员 |
| 自动监控 | 每 30 秒检查一次新交易 |

**示例对话：**
> *"帮我看看 Polymarket 上表现最好的交易员"*
>
> *"以 10% 的比例跟单 0xABC..."*

### 📊 持仓与盈亏

| 功能 | 说明 |
|------|------|
| 持仓追踪 | 当前持仓含成本价和市值 |
| 盈亏报告 | 按日/周/月汇总，支持按交易员拆分 |
| 交易历史 | 完整的交易记录含时间戳 |
| 挂单查询 | 等待成交的未完成订单 |

**示例对话：**
> *"我的 Polymarket 持仓怎么样了？"*
>
> *"看看这周的盈亏"*

### 🛡️ 风险管理

| 参数 | 默认值 | 范围 |
|------|--------|------|
| 滑点容忍度 | 5% | 0.1% – 20% |
| 每日交易上限 | $2,000 | $10 – $100,000 |
| 单市场仓位上限 | $500 | $1 – $50,000 |
| 大单确认阈值 | $1,000 | 需要明确确认 |
| 跟单止损 | 20% | 1% – 99% |
| 跟单止盈 | 50% | 1% – 999% |

---

## 快速上手

### 前置条件

1. **加密货币钱包** — MetaMask、OKX Wallet、Trust Wallet 或 TokenPocket
2. **Polygon 上的 USDC.e** — Polymarket 的交易货币
3. **少量 POL** — 用于 Gas 费（每笔 < $0.01）
4. **Polymarket 账号** — 需先在 [polymarket.com](https://polymarket.com) 完成注册流程

### 安装

从 GitHub 直接安装：

```bash
openclaw skill install https://github.com/AntalphaAI/poly-master
```

或通过 OpenClaw 对话安装：

```
"安装 Poly Master 技能"
```

### 使用示例

直接与 AI Agent 对话即可：

```
👤 "Polymarket 现在什么最热？"
🤖 展示按交易量排名的热门市场及价格

👤 "用 20 USDC 买排名第一市场的 Yes"
🤖 生成订单 + 签名链接 + 二维码

👤 "帮我看看值得跟单的交易员"
🤖 按绩效排名列出顶级交易员

👤 "以 5% 的比例跟单那位交易员"
🤖 开始监控并自动镜像交易
```

---

## MCP Server 信息

| 属性 | 值 |
|------|-----|
| **接口地址** | `https://mcp-skills.ai.antalpha.com/mcp` |
| **协议** | Streamable HTTP (MCP 2024-11-05) |
| **认证** | 调用 `antalpha-register` 工具获取 `agent_id` + `api_key` |
| **工具数量** | 30+ MCP 工具，覆盖市场数据、交易、跟单、持仓管理、对冲策略 |

---

## 签名流程说明

```
Agent             MCP Server         签名页面          用户钱包
  │                   │                  │                │
  │── poly-buy ──────►│                  │                │
  │                   │── 构建订单 ─────►│                │
  │◄── { signUrl } ──│                  │                │
  │                   │                  │                │
  │── 展示签名链接 ────────────────────►│                │
  │                   │                  │── eth_signTypedData ─►│
  │                   │                  │◄── 签名结果 ──│
  │                   │◄── 提交签名 ────│                │
  │                   │── 在 CLOB 下单   │                │
  │◄── 订单确认 ──────│                  │                │
```

**安全保障：**
- ✅ 私钥永不离开钱包
- ✅ 每笔签名绑定具体订单数据（EIP-712）
- ✅ 签名页面在签名前展示完整订单详情
- ✅ 链接 10 分钟后过期
- ✅ 后端不托管资金或私钥

---

## 技术栈

| 组件 | 技术 |
|------|------|
| 链 | Polygon 主网（Chain ID 137） |
| 货币 | USDC.e |
| 市场协议 | Polymarket CTF Exchange（条件代币框架） |
| SDK | [@polymarket/clob-client](https://github.com/Polymarket/clob-client) v5.8.1 |
| 签名方式 | EIP-712 类型数据（浏览器内） |
| 钱包类型 | GnosisSafe (1/1) 代理钱包 |
| MCP 协议 | Streamable HTTP (MCP 2024-11-05) |
| 后端 | NestJS 11 + TypeORM + MySQL + Redis |

---

## 免责声明

⚠️ **非投资建议。** 预测市场存在风险，请勿投入超出承受能力的资金。

⚠️ **Polymarket 可用性** 因司法管辖区而异，用户须自行遵守当地法规。

⚠️ **跟单交易** 会复制他人决策，历史表现不代表未来收益。

⚠️ **Polygon Gas 费** 极低（< $0.01/笔），但需持有少量 POL。

---

## 文档

- [SKILL.md](./SKILL.md) — 完整 Agent 指令、MCP 工具参考、输出格式规范
- [docs/quickstart.md](./docs/quickstart.md) — 面向用户的配置指南（v2 已更新）

---

## 许可

MIT © [Antalpha AI Team](https://www.antalpha.com/)

---

**由 [Antalpha AI](https://ai.antalpha.com) 构建** 🎯 | v2.0.0

*为下一代 AI 驱动的预测市场交易提供动力。*
