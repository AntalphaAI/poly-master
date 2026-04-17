# 🎯 Poly Master v2 — Polymarket 预测市场 + PolyClaw 对冲策略

> **Powered by [Antalpha AI](https://ai.antalpha.com)** — Zero-custody Polymarket aggregated trading, copy-trading & LLM-driven hedge arbitrage

[![Version](https://img.shields.io/badge/version-2.0.0-blue)]()
[![MCP](https://img.shields.io/badge/protocol-MCP%202024--11--05-green)]()
[![Chain](https://img.shields.io/badge/chain-Polygon-8247E5)]()
[![Builder](https://img.shields.io/badge/Polymarket-Builder%20Program-orange)]()

---

[English](#english) | [中文](#中文)

---

## English

### What's New in v2

Poly Master v2 adds the **PolyClaw Strategy Layer** — an LLM-driven hedge arbitrage engine ported from the original Python PolyClaw project. It scans Polymarket for logically implied market pairs and generates near-risk-free hedge signals (totalCost < 1 USDC).

**New in v2.0.0:**
- 🔮 PolyClaw hedge strategy (5 new MCP tools)
- 🏗️ Polymarket Builder Program attribution (all CLOB orders carry `X-Builder-Key`)
- ⛽ Relayer integration (gas-free on-chain ops for users)
- 🔌 LLM proxy with per-agent metering & billing (`llm_token_usage` table)
- 📡 Strategy metrics dashboard (Tier distribution, signal rate, slippage cancellation rate)

### Core Concept: Logical Implication Arbitrage

```
If: "A = YES" logically implies "B = YES"
Then: Buy A-YES + Buy B-NO forms a hedge where totalCost < 1.0
      → Expected profit = 1.0 - totalCost (near-risk-free)
```

This is different from statistical correlation — it's based on **hard logical necessity** detected by LLM reasoning.

### Architecture

```
User ←→ AI Agent ←→ Antalpha MCP Server
                          │
              ┌───────────┼──────────────┐
              ▼           ▼              ▼
       PolyClawStrategy  LlmProxy    BuilderModule
       Scan → Signal →  Per-agent   X-Builder-Key
       Execute          token meter  + Relayer
              │
              ▼
    Polymarket CLOB API (Polygon)
```

### Quick Start

#### 1. Install

Install through your AI agent's skill manager or OpenClaw:

```bash
# OpenClaw
openclaw skill install poly-master

# Or clone directly
git clone https://github.com/AntalphaAI/poly-master
```

#### 2. Register

On first use, ask your agent:
> "Register me on Poly Master"

The agent calls `antalpha-register` and persists your `agent_id` + `api_key`.

#### 3. Trade

```
"What's hot on Polymarket right now?"
"Buy $50 YES on the Iran nuclear deal"
"Follow top 3 traders at 10% copy ratio"
"How's my portfolio doing?"
```

#### 4. PolyClaw Strategy (v2)

```
"Scan for hedge arbitrage opportunities"
"Show me T1 and T2 signals"
"Execute signal #3 with $100"
"Show the strategy dashboard"
```

### MCP Tools Summary

#### v1 (existing)
| Category | Tools |
|----------|-------|
| Market Discovery | `poly-trending`, `poly-new`, `poly-market-info` |
| Direct Trading | `poly-buy`, `poly-sell`, `poly-confirm`, `poly-order-status`, `poly-orders` |
| Copy Trading | `poly-master-traders`, `poly-master-follow`, `poly-master-status`, `poly-master-risk`, `poly-master-pnl`, `poly-master-orders` |
| Portfolio | `poly-positions`, `poly-history`, `poly-open-orders` |
| System | `antalpha-register` |

#### v2 (new — PolyClaw Strategy)
| Tool | Description |
|------|-------------|
| `poly-master-strategy-scan` | Scan markets for hedge signals, returns Tier-ranked list |
| `poly-master-strategy-signal` | Get full details for a specific signal |
| `poly-master-strategy-execute` | Execute a two-leg hedge order (generates signing URLs) |
| `poly-master-strategy-metrics` | Strategy dashboard: Tier distribution, signal rate, slippage rate |
| `poly-master-strategy-dry-run` | Toggle Dry-Run mode (true = log only, false = live execution) |

### Signal Tiers

| Tier | Coverage | Risk Level |
|------|----------|------------|
| T1 | ≥ 0.95 | Near risk-free |
| T2 | ≥ 0.90 | Low risk |
| T3 | ≥ 0.85 | Moderate (watch liquidity) |

### Security

- **Zero custody**: Private keys never leave the user's wallet
- **Builder Key**: Stored in `.env.local`, never committed to git, never shared in chat
- **Wallet signing**: EIP-712 typed data via browser signing page
- **DRY_RUN**: Default `true` in production — must explicitly set `false` to execute live trades

---

## 中文

### v2 新增内容

Poly Master v2 新增 **PolyClaw 策略层** —— 基于 LLM 推理的对冲套利引擎，从原始 Python PolyClaw 项目移植。扫描 Polymarket 市场间的逻辑蕴含关系，发现接近无风险的对冲信号（totalCost < 1 USDC）。

**v2.0.0 更新：**
- 🔮 PolyClaw 对冲策略（5 个新 MCP 工具）
- 🏗️ Polymarket Builder Program 归因（所有 CLOB 订单携带 `X-Builder-Key`，获取 USDC 收益分成）
- ⛽ Relayer 集成（用户免 Gas 链上操作）
- 🔌 LLM 代理 + 按 agent_id 计量计费
- 📡 策略监控看板

### 核心原理：逻辑蕴含套利

```
如果："A=YES" 在逻辑上必然导致 "B=YES"
则：买入 A-YES + 买入 B-NO 构成对冲结构
    totalCost < 1.0 → 预期利润 = 1.0 - totalCost
```

与统计相关性策略不同，PolyClaw 基于 **刚性逻辑必然性**（由 LLM 推理识别）。

### 快速开始

#### 第一步：注册

首次使用对 AI 说：
> "帮我注册 Poly Master"

Agent 调用 `antalpha-register` 并持久化 `agent_id` + `api_key`。

#### 第二步：普通交易

```
"Polymarket 现在最热的市场是什么？"
"买 $50 的是，伊朗核协议"
"跟随前 3 名交易员，10% 跟单比例"
"查看我的持仓"
```

#### 第三步：PolyClaw 策略（v2 新功能）

```
"帮我扫描对冲套利机会"
"显示 T1 和 T2 信号"
"用 $100 执行第 3 个信号"
"显示策略看板"
```

### 对冲策略执行流程

```
1. poly-master-strategy-scan → 获取信号列表（按覆盖率排序）
2. poly-master-strategy-signal → 查看信号详情（双腿价格/流动性/推理依据）
3. 用户确认 → poly-master-strategy-execute
4. 依次完成两腿签名（target 腿先，cover 腿后）
```

**风控要点：**
- `totalCost ≥ 1` 的信号直接拒绝
- 下单金额不超过 `availableSize`（盘口实际流动性）
- 第一腿失败时立即 abort，不提交第二腿（防止悬挂仓位）

### Builder Program 收益

PolyMaster V2 通过 Polymarket Builder Program 接入：
- 所有订单归因至 Antalpha Builder 账户
- 按每周交易量获取 USDC 奖励分成
- 用户享受 Relayer 代付 Gas（需 Safe 或代理钱包）

---

## Environment Variables

```env
# .env.local (never commit to git)

# Polymarket Builder Program (Phase 5)
POLYMARKET_BUILDER_API_KEY=<from polymarket.com/settings?tab=builder>
POLYMARKET_RELAYER_API_KEY=<Relayer API Key>
POLYMARKET_USE_RELAYER=true        # false for local dev

# LLM Proxy (Phase 0)
OPENAI_MASTER_API_KEY=<platform master key>
OPENAI_BASE_URL=<optional: custom endpoint>

# Local MySQL (for token usage metering)
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USERNAME=antalpha
DB_PASSWORD=<password>
DB_DATABASE=antalpha_skills
```

---

## Backend Module Structure (V2)

```
libs/skills/poly-master/src/
├── poly-master.module.ts         # Root module
├── service/                      # V1: market discovery, copy trading
├── strategy/                     # V2: PolyClaw strategy layer
│   ├── services/
│   │   ├── coverage-calculator.service.ts   # Decimal.js coverage math
│   │   ├── hedge-derivation.service.ts      # Implication → hedge position
│   │   ├── llm-analyzer.service.ts          # LLM + 1-to-1 Redis cache
│   │   ├── strategy-engine.service.ts       # Scan orchestration + event emit
│   │   ├── circuit-breaker.service.ts       # LLM 429/5xx protection
│   │   ├── trade-execution.service.ts       # OnEvent handler + revalidate
│   │   ├── market-scanner.service.ts        # Fetch + MarketInfo bridge
│   │   └── scan-metrics.service.ts          # In-memory dashboard
│   ├── interfaces/
│   │   └── hedge-signal.interface.ts        # HedgeSignal + ImplicationResult
│   └── poly-claw-strategy.module.ts
├── builder/                      # V2: Builder Program attribution
│   ├── builder-order.service.ts  # Mandatory X-Builder-Key on all CLOB orders
│   ├── relayer.service.ts        # Gas-free approval via Relayer
│   ├── builder.config.ts
│   └── builder.module.ts
└── llm-proxy/ (shared lib)       # LLM proxy + BullMQ billing worker
    ├── llm-proxy.service.ts
    ├── billing.worker.ts
    └── token-usage.entity.ts
```

**Test coverage**: 90/90 tests pass (Phase 0–5 cumulative) ✅

---

## Links

- MCP Server: `https://mcp-skills.ai.antalpha.com/mcp`
- Polymarket: `https://polymarket.com`
- Builder Dashboard: `https://builders.polymarket.com`
- Antalpha AI: `https://ai.antalpha.com`

---

Built by [Antalpha AI](https://ai.antalpha.com) | v2.0.0 | 2026-04-15
