/**
 * Poly Master — Copy Trading Engine
 *
 * Orchestrates the full copy-trading flow:
 * 1. Monitor followed traders' trades
 * 2. Apply copy ratio and risk checks
 * 3. Construct and submit orders via signing page
 * 4. Track positions and PnL
 */

import { ClobManager, Side, OrderType } from "./clob.js";
import { TradeMonitor, type PolyTrade } from "./trade-monitor.js";
import * as db from "./db.js";
import type { CopyConfig, RiskConfig, CopyOrder, SignRequest } from "./types.js";
import crypto from "node:crypto";

export interface CopyEngineOptions {
  clob: ClobManager;
  /** Callback to notify user of new orders (send signing URL) */
  onOrderCreated: (order: CopyOrder, signUrl: string) => void;
  /** Callback to notify user of events (risk triggers, errors) */
  onNotification: (message: string, level: "info" | "warn" | "error") => void;
}

export class CopyEngine {
  private clob: ClobManager;
  private monitor: TradeMonitor | null = null;
  private onOrderCreated: CopyEngineOptions["onOrderCreated"];
  private onNotification: CopyEngineOptions["onNotification"];
  private aggregationBuffer: Map<string, PolyTrade[]> = new Map(); // marketId → trades
  private aggregationTimer: ReturnType<typeof setTimeout> | null = null;
  private paused = false;

  constructor(options: CopyEngineOptions) {
    this.clob = options.clob;
    this.onOrderCreated = options.onOrderCreated;
    this.onNotification = options.onNotification;
  }

  /**
   * Start copy-trading: begin monitoring followed traders
   */
  start(): void {
    const traders = db.getActiveTraders();
    if (traders.length === 0) {
      this.onNotification("No traders to follow. Add traders first.", "warn");
      return;
    }

    this.paused = false;
    const addresses = traders.map((t) => t.address);

    this.monitor = new TradeMonitor({
      addresses,
      pollIntervalMs: 30_000, // 30s polling
      onNewTrades: (trades) => this.handleNewTrades(trades),
      onError: (err) => {
        this.onNotification(`Monitor error: ${err.message}`, "error");
      },
    });

    this.monitor.start();
    this.onNotification(
      `🎯 Copy trading started! Monitoring ${traders.length} trader(s): ${traders.map((t) => t.username || t.address.slice(0, 8)).join(", ")}`,
      "info",
    );
  }

  /**
   * Stop copy-trading
   */
  stop(): void {
    if (this.monitor) {
      this.monitor.stop();
      this.monitor = null;
    }
    if (this.aggregationTimer) {
      clearTimeout(this.aggregationTimer);
      this.aggregationTimer = null;
    }
    this.aggregationBuffer.clear();
    this.onNotification("⏹️ Copy trading stopped.", "info");
  }

  /**
   * Pause (stop placing new orders, keep monitoring)
   */
  pause(): void {
    this.paused = true;
    this.onNotification("⏸️ Copy trading paused. Monitoring continues.", "info");
  }

  /**
   * Resume after pause
   */
  resume(): void {
    this.paused = false;
    this.onNotification("▶️ Copy trading resumed.", "info");
  }

  /** Is the engine running? */
  isRunning(): boolean {
    return this.monitor?.isRunning() || false;
  }

  /** Is the engine paused? */
  isPaused(): boolean {
    return this.paused;
  }

  /**
   * Handle new trades from monitored traders
   */
  private handleNewTrades(trades: PolyTrade[]): void {
    if (this.paused) return;

    for (const trade of trades) {
      const traderAddr = trade.proxyWallet.toLowerCase();

      // Check if this trader is still active in our follow list
      const traders = db.getActiveTraders();
      const followed = traders.find(
        (t) => t.address.toLowerCase() === traderAddr,
      );
      if (!followed) continue;

      // Add to aggregation buffer (group by market)
      const key = `${traderAddr}:${trade.conditionId}`;
      const buffer = this.aggregationBuffer.get(key) || [];
      buffer.push(trade);
      this.aggregationBuffer.set(key, buffer);

      this.onNotification(
        `📡 Detected trade: ${followed.username || traderAddr.slice(0, 8)} ${trade.side} ${trade.size.toFixed(2)} "${trade.title}" (${trade.outcome}) @ $${trade.price.toFixed(4)}`,
        "info",
      );
    }

    // Start/reset aggregation timer (15 min window)
    this.scheduleAggregation();
  }

  /**
   * Schedule aggregated order execution (15 min window to batch trades)
   */
  private scheduleAggregation(): void {
    // For MVP, execute immediately instead of waiting 15 min
    // This simplifies the flow: detect trade → immediately create copy order
    // In V1, we'll add proper aggregation windowing
    this.executeAggregatedOrders();
  }

  /**
   * Process aggregation buffer and create copy orders
   */
  private async executeAggregatedOrders(): Promise<void> {
    const riskConfig = db.getRiskConfig();

    for (const [key, trades] of this.aggregationBuffer) {
      const [traderAddr, conditionId] = key.split(":");
      const followed = db
        .getActiveTraders()
        .find((t) => t.address.toLowerCase() === traderAddr);
      if (!followed) continue;

      // Aggregate: net position for this market
      let netSize = 0;
      let netSide: "BUY" | "SELL" = "BUY";
      let lastPrice = 0;
      let tokenId = "";
      let title = "";
      let outcome = "";

      for (const trade of trades) {
        if (trade.side === "BUY") {
          netSize += trade.size;
        } else {
          netSize -= trade.size;
        }
        lastPrice = trade.price;
        tokenId = trade.asset;
        title = trade.title;
        outcome = trade.outcome;
      }

      if (netSize === 0) continue; // Net zero, skip

      netSide = netSize > 0 ? "BUY" : "SELL";
      netSize = Math.abs(netSize);

      // Apply copy ratio
      const copySize = netSize * (followed.copy_ratio / 100);
      if (copySize < 0.1) continue; // Too small, skip

      const total = copySize * lastPrice;

      // Risk checks
      if (!this.passesRiskChecks(conditionId, total, lastPrice, riskConfig)) {
        continue;
      }

      // Create order
      await this.createCopyOrder({
        traderAddress: traderAddr,
        marketId: conditionId,
        tokenId,
        side: netSide,
        price: lastPrice,
        size: copySize,
        title,
        outcome,
      });
    }

    // Clear buffer
    this.aggregationBuffer.clear();
  }

  /**
   * Risk checks before placing an order
   */
  private passesRiskChecks(
    marketId: string,
    total: number,
    price: number,
    risk: any,
  ): boolean {
    // Max position per market
    if (total > risk.max_position_per_market) {
      this.onNotification(
        `⚠️ Order blocked: total $${total.toFixed(2)} exceeds market limit $${risk.max_position_per_market}`,
        "warn",
      );
      return false;
    }

    // Max slippage check (compare to order book midpoint)
    // TODO: implement actual slippage check against order book in V1

    return true;
  }

  /**
   * Create a copy order and send signing request to user
   */
  private async createCopyOrder(params: {
    traderAddress: string;
    marketId: string;
    tokenId: string;
    side: "BUY" | "SELL";
    price: number;
    size: number;
    title: string;
    outcome: string;
  }): Promise<void> {
    const orderId = crypto.randomUUID();

    // Store order in DB
    const dbInstance = db.getDb();
    dbInstance
      .prepare(
        `INSERT INTO orders (id, trader_address, market_id, token_id, side, price, size, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending_signature', ?, ?)`,
      )
      .run(
        orderId,
        params.traderAddress,
        params.marketId,
        params.tokenId,
        params.side,
        params.price,
        params.size,
        Date.now(),
        Date.now(),
      );

    try {
      // Create order via CLOB client (this triggers the remote signer → signing page)
      const result = await this.clob.createOrder({
        tokenId: params.tokenId,
        price: params.price,
        size: params.size,
        side: params.side === "BUY" ? Side.BUY : Side.SELL,
        orderType: OrderType.GTC,
      });

      // Update order status
      dbInstance
        .prepare(
          "UPDATE orders SET status = 'submitted', polymarket_order_id = ?, updated_at = ? WHERE id = ?",
        )
        .run(result?.orderID || null, Date.now(), orderId);

      this.onNotification(
        `✅ Copy order submitted: ${params.side} ${params.size.toFixed(2)} shares of "${params.title}" (${params.outcome}) @ $${params.price.toFixed(4)}`,
        "info",
      );
    } catch (err) {
      // Update order status to failed
      dbInstance
        .prepare("UPDATE orders SET status = 'failed', updated_at = ? WHERE id = ?")
        .run(Date.now(), orderId);

      this.onNotification(
        `❌ Copy order failed: ${(err as Error).message}`,
        "error",
      );
    }
  }
}
