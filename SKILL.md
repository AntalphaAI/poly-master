---
name: poly-master
description: "Polymarket prediction market skill by Antalpha AI. Discover trending markets, browse event predictions, invest in outcomes, copy-trade top traders, track portfolio & PnL. V2: Poly Master hedge strategy — LLM-driven logical implication arbitrage with Builder Program attribution. Trigger: polymarket, prediction market, 预测市场, poly, copy trade, 跟单, hedge strategy, 对冲策略, arbitrage, 套利"
version: 2.0.0
metadata: {"mcp":{"url":"https://mcp-skills.ai.antalpha.com/mcp","transport":"streamable-http"},"clawdbot":{"emoji":"🎯"}}
---

# Poly Master v2 — Polymarket 预测市场 + Poly Master 对冲策略

> Powered by **Antalpha AI** — Polymarket 聚合交易、跟单与 LLM 驱动对冲套利

---

## Overview

Poly Master v2 在 v1 交易/跟单基础上，新增 **Poly Master 策略层**：利用 LLM 逻辑推理能力，扫描市场间的逻辑蕴含关系，发现接近无风险的对冲套利机会。所有订单通过 Polymarket Builder Program 路由，享受更优执行和免 Gas 操作。

### V2 新增核心能力

| 能力 | 说明 |
|------|------|
| 🔮 **对冲策略扫描** | LLM 分析市场逻辑蕴含关系，输出 T1/T2/T3 分级套利信号 |
| 📡 **实时监控看板** | Tier 分布、滑点取消率、信号频率统计 |
| 🏗️ **Builder Program 接入** | 所有 CLOB 订单通过 Polymarket Builder Program 路由，享受优先执行和免 Gas 操作 |
| ⛽ **免 Gas 操作** | Relayer 代付链上 Gas，降低交易摩擦 |
| 🔌 **LLM 代理计费** | 平台统一 Master Key，按 agent_id 计量 token 消耗 |

---

## Architecture

```
User ←→ AI Agent ←→ Antalpha MCP Server ←→ Polymarket APIs
                          ↕
              ┌───────────┼──────────────┐
              ▼           ▼              ▼
       PolyMasterStrategy  LlmProxy    BuilderModule
       (对冲扫描引擎)   (计量计费)   (X-Builder-Key)
              ↕           ↕              ↕
         Gamma/CLOB    OpenAI API   CLOB/Relayer
```

- **Zero custody**: 私钥不离开用户钱包
- **MCP Protocol**: Streamable HTTP (MCP 2024-11-05)
- **Chain**: Polygon Mainnet (Chain ID 137)
- **Currency**: USDC.e (`0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174`)
- **Supported Wallets**: MetaMask, OKX Wallet, Trust Wallet, TokenPocket

---

## MCP Tools Reference

### Registration（首次必须）
| Tool | Description |
|------|-------------|
| `antalpha-register` | 注册 agent，返回 `agent_id` + `api_key`。仅调用一次，持久化两个值。 |

### Market Discovery
| Tool | Parameters | Description |
|------|-----------|-------------|
| `poly-trending` | `agent_id`, `limit?`, `category?` | 热门市场（按 24h 成交量）。Category: crypto/politics/sports/geopolitics/finance |
| `poly-new` | `agent_id`, `limit?`, `hours?`, `category?` | 最近创建的市场 |
| `poly-market-info` | `agent_id`, `market_id` | 市场完整信息：价格/成交量/Token ID/结果列表 |

### Direct Trading
| Tool | Parameters | Description |
|------|-----------|-------------|
| `poly-buy` | `agent_id`, `market_id`, `outcome`, `amount_usdc`, `wallet_address`, `proxy_wallet`, `price?` | 买入结果代币。不含 `price` = 市价单；含 `price` = 限价单 |
| `poly-sell` | `agent_id`, `market_id`, `outcome`, `size`, `wallet_address`, `proxy_wallet` | 卖出结果代币 |
| `poly-confirm` | `agent_id`, `order_id` | 查询订单签名状态 + CLOB 成交状态（`pending_signature` / `submitted` / `matched` / `failed`），同时自动修复 signed 但未更新为 submitted 的订单 |
| `poly-master-orders` | `agent_id`, `wallet_address?`, `status?` | 订单列表，支持按状态过滤（含未成交/挂单） |
| `poly-history` | `agent_id`, `wallet_address`, `proxy_wallet`, `limit?` | 链上历史成交记录（来自 Polymarket data API） |

### Copy Trading
| Tool | Parameters | Description |
|------|-----------|-------------|
| `poly-master-traders` | `agent_id`, `limit?`, `sort_by?` | 顶级交易员列表（按胜率/成交量/ROI） |
| `poly-master-follow` | `agent_id`, `address`, `copyRatio` | 跟随/取消跟随交易员，设置跟单比例（0.1 = 10%） |
| `poly-master-status` | `agent_id` | 跟单状态：已关注交易员 + 最近跟单订单 |
| `poly-master-risk` | `agent_id`, `stopLossPercent?`, `takeProfitPercent?`, `maxPositionPerMarket?`, `maxTotal?` | 查看/更新风控参数 |
| `poly-master-pnl` | `agent_id`, `period?` | PnL 报告（day/week/month），按交易员分组 |
| `poly-master-orders` | `agent_id`, `status?` | 跟单订单列表 |

### Portfolio
| Tool | Parameters | Description |
|------|-----------|-------------|
| `poly-positions` | `agent_id`, `wallet_address` | 当前持仓：成本/市值/未实现 PnL |
| `poly-history` | `agent_id`, `wallet_address`, `limit?` | 交易历史记录 |
| `poly-open-orders` | `agent_id`, `wallet_address` | 未成交/挂单中的订单 |

---

## V2 Poly Master Strategy Tools

> **策略原理**：Poly Master 基于逻辑蕴含而非市场相关性寻找套利机会。若 "A=YES 必然导致 B=YES"，则存在接近无风险的双腿对冲结构（totalCost < 1）。

### 策略工具
| Tool | Parameters | Description |
|------|-----------|-------------|
| `poly-master-strategy-scan` | `agent_id`, `limit?`, `min_tier?` | 触发一轮市场扫描，返回按覆盖率排序的对冲信号列表 |
| `poly-master-strategy-signal` | `agent_id`, `signal_id` | 查看单条对冲信号详情（双腿价格、覆盖率、可用流动性） |
| `poly-master-strategy-execute` | `agent_id`, `signal_id`, `size_usdc`, `wallet_address`, `proxy_wallet` | 执行对冲信号（DRY_RUN=false 时才真正下单） |
| `poly-master-strategy-metrics` | `agent_id` | 策略看板：Tier 分布/信号频率/滑点取消率/最近10次扫描 |
| `poly-master-strategy-dry-run` | `agent_id`, `enabled` | 开启/关闭 Dry-Run 模式（true=只记日志，false=真实执行） |

### 信号结构说明

```
HedgeSignal {
  targetMarketId    # 目标市场 ID
  targetPosition    # "YES" | "NO"
  coverMarketId     # 对冲市场 ID
  coverPosition     # "YES" | "NO"
  metrics {
    targetPrice     # 目标腿价格（string, 精度保留）
    coverPrice      # 对冲腿价格（string）
    totalCost       # 两腿总成本，必须 < 1.0
    availableSize   # 最小可交易流动性（盘口最小挂单量）
    expectedProfit  # 预期利润（1 - totalCost）
    coverage        # 覆盖率，必须 ≥ 0.85
    tier            # "T1" (≥0.95) | "T2" (≥0.90) | "T3" (≥0.85)
  }
  reasoning         # LLM 推理依据（自然语言）
  builderAttributed # true = 已携带 Builder 归因头
}
```

### Tier 分级解读

| Tier | Coverage | 说明 |
|------|----------|------|
| T1 | ≥ 0.95 | 极强逻辑蕴含，几乎无风险 |
| T2 | ≥ 0.90 | 强逻辑蕴含，低风险 |
| T3 | ≥ 0.85 | 中等蕴含，需关注流动性 |

---

## Agent Instructions

### 1. 首次使用

```
1. 调用 antalpha-register → 获取 agent_id + api_key
2. 持久化 agent_id 和 api_key（后续所有调用均需要）
3. 询问用户钱包地址 (wallet_address) 和代理钱包地址 (proxy_wallet)
```

### 2. 普通交易流程

```
poly-trending / poly-new → 发现市场
poly-market-info → 查看详情
poly-buy / poly-sell → 生成签名链接
展示订单预览格式（含二维码）→ 用户在钱包内打开签名
```

### 3. Poly Master 对冲策略流程

```
步骤 1: 调用 poly-master-strategy-scan({ agent_id, limit: 5 })
        → 返回按覆盖率排序的信号列表

步骤 2: 展示信号列表（按 Tier 分组，显示 totalCost/coverage/tier）

步骤 3: 用户选择信号后调用 poly-master-strategy-signal({ agent_id, signal_id })
        → 返回完整信号详情（双腿价格、流动性、推理依据）

步骤 4: 确认后调用 poly-master-strategy-execute({
          agent_id, signal_id,
          size_usdc: <用户指定金额>,
          wallet_address, proxy_wallet
        })
        → 返回两条腿的签名链接

步骤 5: 依次展示两条腿的签名链接（先 target 腿，再 cover 腿）
        ⚠️ 必须按顺序签名，不得跳过任一腿
```

**⚠️ 重要风控规则：**
- 调用 `poly-master-strategy-execute` 前，必须先向用户展示 signal 详情并确认
- 若 `availableSize` < 用户指定金额，自动缩减到 availableSize
- `totalCost ≥ 1` 的信号不允许执行（MCP 会拒绝，但 agent 也应前置检查）
- `DRY_RUN=true` 时只记录日志，不产生签名链接

### 4. 查看策略看板

```
poly-master-strategy-metrics({ agent_id })
→ 展示 Dashboard：Tier 分布 / 平均信号数/周期 / 滑点取消率 / 最近10次扫描结果
```

### 5. Portfolio 查询（备用公开 API）

当 `poly-positions` 未部署时：
```
GET https://data-api.polymarket.com/positions?user={proxy_wallet}
```

---

## Mandatory Output Formats

### 订单预览格式（所有 poly-buy / poly-sell 必须使用）

⚠️ **硬性规则**：所有字段值必须来自 MCP 响应，不允许填写硬编码数据。

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

发送前检查：✅ 7 行都有 ✅ 二维码已生成 ✅ 品牌 footer ✅ 无额外注释

### 对冲信号列表格式

```
🔮 Poly Master 对冲信号 — {扫描时间}

共发现 {n} 个信号

⭐⭐⭐ T1 信号（Coverage ≥ 0.95）
━━━━━━━━━━━━━━━━━━━━━━━━
1️⃣ Signal #{id}
   📌 目标：{targetMarketQuestion} → {targetPosition}
   🔗 对冲：{coverMarketQuestion} → {coverPosition}
   💰 总成本：{totalCost} USDC（利润空间：{expectedProfit} USDC）
   📊 覆盖率：{coverage} | 可用流动性：{availableSize} USDC
   💡 {reasoning}

⭐⭐ T2 信号 / ⭐ T3 信号
...

由 Antalpha AI Poly Master 策略引擎提供
```

### 对冲执行格式（两腿）

```
⚡ 对冲执行 — Signal #{id}

🦵 第一腿（Target）
📋 {targetMarket}
🎯 方向：BUY {targetPosition}
💰 价格：${targetPrice}/份 | 数量：{size} 份
🔗 签名页面：{signUrl_leg1}
[二维码 1]

🦵 第二腿（Cover）
📋 {coverMarket}
🎯 方向：BUY {coverPosition}
💰 价格：${coverPrice}/份 | 数量：{size} 份
🔗 签名页面：{signUrl_leg2}
[二维码 2]

⚠️ 请先完成第一腿签名，再签第二腿

由 Antalpha AI Poly Master 策略引擎提供
```

### Portfolio 格式

```
🎯 Polymarket 持仓报告

1️⃣ {event_title}
   方向：{outcome}
   持仓：{size} 份 | 均价 ${avg_price}
   现价：${cur_price} | 市值 ${current_value}
   盈亏：${pnl} ({pnl_percent}%)
   到期：{end_date}

📊 汇总：总投入 ${total_cost} | 市值 ${total_value} | 盈亏 ${total_pnl} ({total_pnl_percent}%)

由 Antalpha AI 提供聚合服务
```

---

## Risk Defaults

| Parameter | Default | Description |
|-----------|---------|-------------|
| Slippage Tolerance | 5% | 市价单最大价格偏差 |
| Daily Bet Limit | $2,000 | 每日最大交易额 |
| Per-Market Limit | $500 | 单市场最大仓位 |
| Large Order Threshold | $1,000 | 需显式确认 |
| Copy Trading Stop-Loss | 20% | 自动暂停阈值 |
| Poly Master Min Coverage | 0.85 | T3 最低覆盖率（低于此不展示） |
| Poly Master Max Position | availableSize | 不超过盘口最小流动性 |

---

## Builder Program

PolyMaster V2 所有 CLOB 订单均通过 Polymarket Builder Program 路由：

- **X-Builder-Key**：每笔订单必须携带（缺失则拒单）
- **Relayer**：用户享受免 Gas 链上操作（需 Safe/Proxy 钱包）

---

## How Signing Works

1. 🔔 Agent 通过 MCP 生成签名 URL
2. 🌐 用户在钱包内置浏览器（MetaMask/OKX/Trust/TokenPocket）打开链接
3. 🔐 页面展示订单详情（市场/方向/价格/数量）
4. ✅ 用户点击"签名" — 钱包弹出 EIP-712 类型化数据签名
5. 📤 签名提交到服务器，订单发往 Polymarket CLOB

**安全保障**：私钥不离开钱包，签名页面仅请求特定订单数据的签名。

---

## Polymarket SDK Reference（后端集成参考）

- **EIP-712 domain.name**: `"Polymarket CTF Exchange"`（不是 "ClobExchange"）
- **signatureType**: `2`（POLY_GNOSIS_SAFE）— 用户通过 GnosisSafe 代理钱包交易
- **maker**: proxy wallet | **signer**: EOA wallet
- **HMAC owner**: API Key（非钱包地址）
- **API Key**: 一次性 `createApiKey()`，后续用 `deriveApiKey()`
- **USDC.e (Polygon)**: `0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174`

---

## Brand Attribution（必须）

⚠️ 所有用户可见输出必须以品牌 footer 结尾：

- 中文：`由 Antalpha AI 提供聚合服务`
- 英文：`Powered by Antalpha AI`

适用范围：市场列表、订单预览、持仓报告、PnL 报告、跟单状态、交易员排名、对冲信号列表、策略看板 —— **无例外**。

---

## Files

```
poly-master/
├── SKILL.md              # Agent 指令（本文件）
├── README.md             # 项目对外说明
├── docs/
│   └── quickstart.md     # 用户快速上手
├── references/
│   └── trade-page.html   # 浏览器签名页模板
└── scripts/              # 本地测试脚本
```

---

Built by [Antalpha AI](https://ai.antalpha.com) | MCP: `https://mcp-skills.ai.antalpha.com/mcp` | v2.0.0
