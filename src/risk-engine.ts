/**
 * Poly Master — Risk Engine
 *
 * Monitors positions against risk parameters and triggers alerts/actions:
 * - Stop loss: position loss exceeds threshold
 * - Take profit: position gain exceeds threshold
 * - Position limits: per-market and total portfolio
 * - Slippage guard: reject orders with price deviation > threshold
 * - Daily loss limit: total daily loss cap
 */

import * as db from "./db.js";
import { ClobManager } from "./clob.js";

export interface RiskCheckResult {
  passed: boolean;
  reason?: string;
  level: "ok" | "warn" | "block";
}

export interface PositionRiskStatus {
  marketId: string;
  tokenId: string;
  title: string;
  side: string;
  size: number;
  entryPrice: number;
  currentPrice: number;
  pnlPercent: number;
  pnlUsd: number;
  status: "ok" | "stop_loss" | "take_profit" | "at_risk";
}

/**
 * Pre-order risk check — called before placing a copy order
 */
export function checkOrderRisk(params: {
  marketId: string;
  side: "BUY" | "SELL";
  size: number;
  price: number;
  midpointPrice?: number;
}): RiskCheckResult {
  const risk = db.getRiskConfig();
  const orderTotal = params.size * params.price;

  // 1. Position limit per market
  if (orderTotal > risk.max_position_per_market) {
    return {
      passed: false,
      reason: `Order $${orderTotal.toFixed(2)} exceeds per-market limit $${risk.max_position_per_market}`,
      level: "block",
    };
  }

  // 2. Total portfolio limit
  const totalExposure = getTotalExposure();
  if (totalExposure + orderTotal > risk.max_total_position) {
    return {
      passed: false,
      reason: `Total exposure $${(totalExposure + orderTotal).toFixed(2)} would exceed portfolio limit $${risk.max_total_position}`,
      level: "block",
    };
  }

  // 3. Slippage check
  if (params.midpointPrice && params.midpointPrice > 0) {
    const slippage =
      Math.abs(params.price - params.midpointPrice) / params.midpointPrice;
    const slippagePercent = slippage * 100;
    if (slippagePercent > risk.max_slippage_percent) {
      return {
        passed: false,
        reason: `Slippage ${slippagePercent.toFixed(1)}% exceeds limit ${risk.max_slippage_percent}%`,
        level: "block",
      };
    }
  }

  return { passed: true, level: "ok" };
}

/**
 * Position monitoring — check all positions against stop-loss and take-profit
 */
export function checkPositions(
  currentPrices: Map<string, number>,
): PositionRiskStatus[] {
  const risk = db.getRiskConfig();
  const dbInstance = db.getDb();
  const positions = dbInstance
    .prepare("SELECT * FROM positions WHERE size > 0")
    .all() as any[];

  const results: PositionRiskStatus[] = [];

  for (const pos of positions) {
    const currentPrice = currentPrices.get(pos.token_id) || pos.current_price;
    const entryPrice = pos.avg_entry_price;

    // Calculate PnL
    let pnlPercent = 0;
    if (entryPrice > 0) {
      if (pos.side === "YES") {
        // Long position: profit when price goes up
        pnlPercent = ((currentPrice - entryPrice) / entryPrice) * 100;
      } else {
        // Short position: profit when price goes down
        pnlPercent = ((entryPrice - currentPrice) / entryPrice) * 100;
      }
    }
    const pnlUsd = pos.size * (currentPrice - entryPrice) * (pos.side === "YES" ? 1 : -1);

    let status: PositionRiskStatus["status"] = "ok";

    // Stop loss check
    if (pnlPercent <= -risk.stop_loss_percent) {
      status = "stop_loss";
    }
    // Take profit check
    else if (pnlPercent >= risk.take_profit_percent) {
      status = "take_profit";
    }
    // Warning zone (80% of stop loss)
    else if (pnlPercent <= -risk.stop_loss_percent * 0.8) {
      status = "at_risk";
    }

    // Update current price in DB
    dbInstance
      .prepare(
        "UPDATE positions SET current_price = ?, unrealized_pnl = ?, updated_at = ? WHERE id = ?",
      )
      .run(currentPrice, pnlUsd, Date.now(), pos.id);

    results.push({
      marketId: pos.market_id,
      tokenId: pos.token_id,
      title: pos.market_title || "Unknown",
      side: pos.side,
      size: pos.size,
      entryPrice,
      currentPrice,
      pnlPercent: Math.round(pnlPercent * 100) / 100,
      pnlUsd: Math.round(pnlUsd * 100) / 100,
      status,
    });
  }

  return results;
}

/**
 * Get total portfolio exposure (sum of all position values)
 */
function getTotalExposure(): number {
  const dbInstance = db.getDb();
  const result = dbInstance
    .prepare(
      "SELECT COALESCE(SUM(size * avg_entry_price), 0) as total FROM positions WHERE size > 0",
    )
    .get() as any;
  return result?.total || 0;
}

// ============================================================
// Risk Monitor (periodic position checking)
// ============================================================

export interface RiskMonitorOptions {
  clob: ClobManager;
  /** Check interval in ms (default: 5 min) */
  checkIntervalMs?: number;
  /** Callback for risk alerts */
  onAlert: (alert: {
    type: "stop_loss" | "take_profit" | "at_risk";
    position: PositionRiskStatus;
    message: string;
  }) => void;
}

export class RiskMonitor {
  private clob: ClobManager;
  private checkIntervalMs: number;
  private onAlert: RiskMonitorOptions["onAlert"];
  private timer: ReturnType<typeof setInterval> | null = null;
  private running = false;
  // Track which alerts we've already sent to avoid spam
  private alertedPositions: Set<string> = new Set();

  constructor(options: RiskMonitorOptions) {
    this.clob = options.clob;
    this.checkIntervalMs = options.checkIntervalMs || 5 * 60_000;
    this.onAlert = options.onAlert;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    console.log(
      `[poly-master] Risk monitor started, checking every ${this.checkIntervalMs / 1000}s`,
    );
    this.check();
    this.timer = setInterval(() => this.check(), this.checkIntervalMs);
  }

  stop(): void {
    this.running = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  isRunning(): boolean {
    return this.running;
  }

  private async check(): Promise<void> {
    try {
      // Fetch current prices for all held tokens
      const dbInstance = db.getDb();
      const positions = dbInstance
        .prepare("SELECT DISTINCT token_id FROM positions WHERE size > 0")
        .all() as any[];

      const prices = new Map<string, number>();
      for (const pos of positions) {
        try {
          const mid = await this.clob.getMidpoint(pos.token_id);
          if (mid?.mid) {
            prices.set(pos.token_id, parseFloat(mid.mid));
          }
        } catch {
          // Skip tokens with no order book
        }
      }

      // Check positions against risk rules
      const statuses = checkPositions(prices);

      for (const status of statuses) {
        if (status.status === "ok") {
          // Clear alert tracking for recovered positions
          this.alertedPositions.delete(status.tokenId);
          continue;
        }

        // Only alert once per position per status
        const alertKey = `${status.tokenId}:${status.status}`;
        if (this.alertedPositions.has(alertKey)) continue;
        this.alertedPositions.add(alertKey);

        const emoji =
          status.status === "stop_loss"
            ? "🔴"
            : status.status === "take_profit"
              ? "🟢"
              : "🟡";

        this.onAlert({
          type: status.status as any,
          position: status,
          message:
            `${emoji} *${status.status === "stop_loss" ? "STOP LOSS" : status.status === "take_profit" ? "TAKE PROFIT" : "AT RISK"}*\n` +
            `Market: ${status.title}\n` +
            `Side: ${status.side} | Size: ${status.size.toFixed(2)}\n` +
            `Entry: $${status.entryPrice.toFixed(4)} → Current: $${status.currentPrice.toFixed(4)}\n` +
            `PnL: ${status.pnlPercent >= 0 ? "+" : ""}${status.pnlPercent.toFixed(1)}% ($${status.pnlUsd >= 0 ? "+" : ""}${status.pnlUsd.toFixed(2)})`,
        });
      }
    } catch (err) {
      console.error("[poly-master] Risk check error:", err);
    }
  }
}
