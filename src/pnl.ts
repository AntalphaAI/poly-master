/**
 * Poly Master — PnL Calculator
 *
 * Calculates realized and unrealized PnL from order history and positions.
 * Supports daily/weekly/monthly/all-time reporting with per-trader breakdown.
 */

import * as db from "./db.js";
import type { PnLReport } from "./types.js";

/**
 * Calculate comprehensive PnL report
 */
export function calculatePnL(period: "day" | "week" | "month" | "all" = "all"): PnLReport {
  const dbInstance = db.getDb();
  const now = Date.now();

  // Time filter
  let since = 0;
  switch (period) {
    case "day":
      since = now - 86_400_000;
      break;
    case "week":
      since = now - 7 * 86_400_000;
      break;
    case "month":
      since = now - 30 * 86_400_000;
      break;
    default:
      since = 0;
  }

  // Get completed orders in period
  const orders = dbInstance
    .prepare(
      `SELECT * FROM orders
       WHERE created_at > ? AND status IN ('submitted', 'matched')
       ORDER BY created_at DESC`,
    )
    .all(since) as any[];

  // Get current positions
  const positions = dbInstance
    .prepare("SELECT * FROM positions WHERE size > 0")
    .all() as any[];

  // Calculate realized PnL from closed positions
  const realizedPnl = positions.reduce(
    (sum: number, p: any) => sum + (p.realized_pnl || 0),
    0,
  );

  // Calculate unrealized PnL from open positions
  const unrealizedPnl = positions.reduce(
    (sum: number, p: any) => sum + (p.unrealized_pnl || 0),
    0,
  );

  const totalPnl = realizedPnl + unrealizedPnl;

  // Win rate calculation
  const closedTrades = dbInstance
    .prepare(
      `SELECT * FROM orders
       WHERE created_at > ? AND status = 'matched'`,
    )
    .all(since) as any[];

  // Simple win rate: orders where we sold higher than bought
  // (More accurate calculation would track entry/exit pairs)
  const totalTrades = closedTrades.length;
  const winningTrades = closedTrades.filter((o: any) => {
    // Simplified: BUY orders with price < 0.5 or SELL orders with price > 0.5
    // are considered "winning" direction in prediction markets
    return (o.side === "BUY" && o.price < 0.5) || (o.side === "SELL" && o.price > 0.5);
  }).length;
  const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

  // Best and worst trades
  let bestTrade: PnLReport["bestTrade"] = null;
  let worstTrade: PnLReport["worstTrade"] = null;

  for (const pos of positions) {
    const pnl = pos.unrealized_pnl || 0;
    if (!bestTrade || pnl > (bestTrade.pnl || 0)) {
      bestTrade = { market: pos.market_title || pos.market_id, pnl };
    }
    if (!worstTrade || pnl < (worstTrade.pnl || 0)) {
      worstTrade = { market: pos.market_title || pos.market_id, pnl };
    }
  }

  // Per-trader breakdown
  const traderMap = new Map<string, { pnl: number; trades: number }>();
  for (const order of orders) {
    const addr = order.trader_address;
    const existing = traderMap.get(addr) || { pnl: 0, trades: 0 };
    existing.trades++;
    // Simplified: use order value as proxy
    existing.pnl += order.side === "BUY" ? -(order.price * order.size) : order.price * order.size;
    traderMap.set(addr, existing);
  }

  const byTrader = Array.from(traderMap.entries()).map(([address, data]) => ({
    address,
    pnl: Math.round(data.pnl * 100) / 100,
    trades: data.trades,
  }));

  return {
    period,
    totalPnl: Math.round(totalPnl * 100) / 100,
    realizedPnl: Math.round(realizedPnl * 100) / 100,
    unrealizedPnl: Math.round(unrealizedPnl * 100) / 100,
    totalTrades,
    winRate: Math.round(winRate * 10) / 10,
    bestTrade,
    worstTrade,
    byTrader,
  };
}

/**
 * Format PnL report as human-readable text
 */
export function formatPnLReport(report: PnLReport): string {
  const lines: string[] = [];
  const periodLabel = {
    day: "Today",
    week: "This Week",
    month: "This Month",
    all: "All Time",
  }[report.period];

  lines.push(`📊 *PnL Report — ${periodLabel}*`);
  lines.push("");

  // Summary
  const pnlEmoji = report.totalPnl >= 0 ? "🟢" : "🔴";
  lines.push(`${pnlEmoji} *Total PnL:* $${report.totalPnl >= 0 ? "+" : ""}${report.totalPnl.toFixed(2)}`);
  lines.push(`   Realized: $${report.realizedPnl >= 0 ? "+" : ""}${report.realizedPnl.toFixed(2)}`);
  lines.push(`   Unrealized: $${report.unrealizedPnl >= 0 ? "+" : ""}${report.unrealizedPnl.toFixed(2)}`);
  lines.push("");

  // Stats
  lines.push(`📈 *Stats:*`);
  lines.push(`   Trades: ${report.totalTrades}`);
  lines.push(`   Win Rate: ${report.winRate}%`);
  lines.push("");

  // Best/Worst
  if (report.bestTrade) {
    lines.push(`🏆 Best: "${report.bestTrade.market}" ($${report.bestTrade.pnl >= 0 ? "+" : ""}${report.bestTrade.pnl.toFixed(2)})`);
  }
  if (report.worstTrade) {
    lines.push(`💀 Worst: "${report.worstTrade.market}" ($${report.worstTrade.pnl >= 0 ? "+" : ""}${report.worstTrade.pnl.toFixed(2)})`);
  }

  // Per-trader breakdown
  if (report.byTrader.length > 0) {
    lines.push("");
    lines.push(`👤 *By Trader:*`);
    for (const t of report.byTrader) {
      const emoji = t.pnl >= 0 ? "🟢" : "🔴";
      lines.push(
        `   ${emoji} ${t.address.slice(0, 8)}... — $${t.pnl >= 0 ? "+" : ""}${t.pnl.toFixed(2)} (${t.trades} trades)`,
      );
    }
  }

  return lines.join("\n");
}

/**
 * Take a PnL snapshot (for historical tracking)
 */
export function savePnLSnapshot(): void {
  const report = calculatePnL("day");
  const dbInstance = db.getDb();
  const today = new Date().toISOString().split("T")[0];

  dbInstance
    .prepare(
      `INSERT OR REPLACE INTO pnl_snapshots (snapshot_date, total_pnl, realized_pnl, unrealized_pnl, total_trades, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(
      today,
      report.totalPnl,
      report.realizedPnl,
      report.unrealizedPnl,
      report.totalTrades,
      Date.now(),
    );
}

/**
 * Get historical PnL snapshots
 */
export function getPnLHistory(days = 30): Array<{
  date: string;
  totalPnl: number;
  realizedPnl: number;
  unrealizedPnl: number;
  totalTrades: number;
}> {
  const dbInstance = db.getDb();
  return dbInstance
    .prepare(
      `SELECT snapshot_date as date, total_pnl as totalPnl, realized_pnl as realizedPnl,
              unrealized_pnl as unrealizedPnl, total_trades as totalTrades
       FROM pnl_snapshots
       ORDER BY snapshot_date DESC
       LIMIT ?`,
    )
    .all(days) as any[];
}
