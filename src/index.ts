/**
 * Poly Master — Main Entry Point
 *
 * Initializes all modules and exposes the tool interface
 * for OpenClaw MCP integration.
 */

import { ClobManager } from "./clob.js";
import { CopyEngine } from "./copy-engine.js";
import { createSignServer } from "./sign-server.js";
import { discoverTraders, getTradesByAddress } from "./trade-monitor.js";
import { RiskMonitor, checkOrderRisk, checkPositions } from "./risk-engine.js";
import { calculatePnL, formatPnLReport, savePnLSnapshot, getPnLHistory } from "./pnl.js";
import { ConfigError, wrapToolCall, withRetry } from "./errors.js";
import * as db from "./db.js";
import type { PolyMasterConfig } from "./types.js";

// ============================================================
// Global State
// ============================================================

let config: PolyMasterConfig | null = null;
let clob: ClobManager | null = null;
let engine: CopyEngine | null = null;
let riskMonitor: RiskMonitor | null = null;
let notifyCallback: ((msg: string) => void) | null = null;

// ============================================================
// Tool Implementations
// ============================================================

/**
 * poly-master-setup: Configure wallet and derive API credentials
 */
export async function setup(params: {
  walletAddress: string;
  serverPort?: number;
  serverUrl?: string;
}) {
  const {
    walletAddress,
    serverPort = 3847,
    serverUrl = `http://localhost:${serverPort}`,
  } = params;

  config = {
    walletAddress,
    clobHost: "https://clob.polymarket.com",
    chainId: 137,
    signatureType: 0,
    serverPort,
    serverUrl,
  };

  // Save config
  db.setConfig("wallet_address", walletAddress);
  db.setConfig("server_port", String(serverPort));
  db.setConfig("server_url", serverUrl);

  // Start signing server
  createSignServer(serverPort);

  // Initialize CLOB client with remote signer
  clob = new ClobManager({
    walletAddress,
    serverUrl,
    onSignRequest: (req, signUrl) => {
      if (notifyCallback) {
        notifyCallback(
          `🔐 *Signature required!*\n` +
            `Action: ${req.orderSummary.side} ${req.orderSummary.size} shares @ $${req.orderSummary.price}\n` +
            `Total: $${req.orderSummary.total.toFixed(2)} USDC\n` +
            `👉 Sign here: ${signUrl}\n` +
            `⏰ Expires in 5 minutes`,
        );
      }
    },
  });

  // Verify CLOB connectivity
  const ok = await clob.healthCheck();
  if (!ok) {
    throw new Error("Failed to connect to Polymarket CLOB API");
  }

  return {
    status: "ok",
    walletAddress,
    clobConnected: true,
    signServerUrl: serverUrl,
    message: `Setup complete. Wallet ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)} configured. CLOB API connected.`,
  };
}

/**
 * poly-master-traders: Discover and browse top traders
 */
export async function findTraders(params?: {
  sampleSize?: number;
  minTrades?: number;
}) {
  const traders = await discoverTraders(
    params?.sampleSize || 500,
    params?.minTrades || 3,
  );

  return {
    traders: traders.slice(0, 20).map((t) => ({
      address: t.address,
      name: t.name || t.pseudonym || "Anonymous",
      tradeCount: t.tradeCount,
      totalVolume: Math.round(t.totalVolume * 100) / 100,
      avgTradeSize: Math.round(t.avgTradeSize * 100) / 100,
      marketsActive: t.markets.size,
      lastActive: new Date(t.lastActive * 1000).toISOString(),
    })),
    total: traders.length,
    message: `Found ${traders.length} active traders from recent trade data.`,
  };
}

/**
 * poly-master-follow: Set copy targets and parameters
 */
export async function followTrader(params: {
  address: string;
  username?: string;
  copyRatio?: number;
}) {
  const { address, username, copyRatio = 10 } = params;

  // Validate address
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    throw new Error("Invalid Ethereum address");
  }

  if (copyRatio < 1 || copyRatio > 100) {
    throw new Error("Copy ratio must be between 1 and 100");
  }

  // Check trader exists by fetching their recent trades
  const trades = await getTradesByAddress(address, 5);
  const traderName =
    username || trades[0]?.name || trades[0]?.pseudonym || "Unknown";

  db.addTrader(address, traderName, copyRatio);

  return {
    status: "ok",
    trader: {
      address,
      name: traderName,
      copyRatio,
      recentTrades: trades.length,
    },
    message: `Now following ${traderName} (${address.slice(0, 8)}...) with ${copyRatio}% copy ratio.`,
  };
}

/**
 * poly-master-start: Start copy-trading monitor
 */
export function startCopyTrading(params?: {
  notify?: (msg: string) => void;
}) {
  if (!clob) {
    throw new Error("Run setup first");
  }

  if (engine?.isRunning()) {
    return { status: "already_running", message: "Copy trading is already running." };
  }

  notifyCallback = params?.notify || null;

  engine = new CopyEngine({
    clob,
    onOrderCreated: (order, signUrl) => {
      if (notifyCallback) {
        notifyCallback(
          `📋 New copy order: ${order.side} ${order.size} @ $${order.price}\nSign: ${signUrl}`,
        );
      }
    },
    onNotification: (msg, level) => {
      if (notifyCallback) {
        notifyCallback(msg);
      }
      console.log(`[poly-master] [${level}] ${msg}`);
    },
  });

  engine.start();

  // Start risk monitor alongside copy engine
  if (clob && !riskMonitor?.isRunning()) {
    riskMonitor = new RiskMonitor({
      clob,
      checkIntervalMs: 5 * 60_000, // 5 min
      onAlert: (alert) => {
        if (notifyCallback) {
          notifyCallback(alert.message);
        }
        // Auto-pause on stop loss
        if (alert.type === "stop_loss" && engine?.isRunning()) {
          engine.pause();
          if (notifyCallback) {
            notifyCallback("⚠️ Copy trading auto-paused due to stop loss trigger. Review positions and resume manually.");
          }
        }
      },
    });
    riskMonitor.start();
  }

  const traders = db.getActiveTraders();
  return {
    status: "started",
    followedTraders: traders.length,
    message: `Copy trading started. Monitoring ${traders.length} trader(s). Risk monitor active (5 min interval).`,
  };
}

/**
 * poly-master-pause: Pause/resume copy trading
 */
export function pauseCopyTrading(params?: { resume?: boolean }) {
  if (!engine) {
    throw new Error("Copy trading not started");
  }

  if (params?.resume) {
    engine.resume();
    return { status: "resumed", message: "Copy trading resumed." };
  } else {
    engine.pause();
    return { status: "paused", message: "Copy trading paused." };
  }
}

/**
 * poly-master-status: Get current system status
 */
export function getStatus() {
  const traders = db.getActiveTraders();
  const risk = db.getRiskConfig();

  return {
    configured: !!config,
    walletAddress: config?.walletAddress || db.getConfig("wallet_address") || null,
    clobConnected: clob ? true : false,
    copyTrading: {
      running: engine?.isRunning() || false,
      paused: engine?.isPaused() || false,
    },
    followedTraders: traders.map((t) => ({
      address: t.address,
      name: t.username,
      copyRatio: t.copy_ratio,
    })),
    riskConfig: {
      stopLossPercent: risk?.stop_loss_percent,
      takeProfitPercent: risk?.take_profit_percent,
      maxPositionPerMarket: risk?.max_position_per_market,
      maxTotalPosition: risk?.max_total_position,
      maxSlippagePercent: risk?.max_slippage_percent,
    },
  };
}

/**
 * poly-master-pnl: Get PnL report
 */
export function getPnlReport(params?: {
  period?: "day" | "week" | "month" | "all";
  format?: "json" | "text";
}) {
  const period = params?.period || "all";
  const report = calculatePnL(period);

  if (params?.format === "text") {
    return {
      ...report,
      formatted: formatPnLReport(report),
      message: formatPnLReport(report),
    };
  }

  return {
    ...report,
    message: `${period} report: ${report.totalTrades} trades, PnL $${report.totalPnl >= 0 ? "+" : ""}${report.totalPnl.toFixed(2)} (realized: $${report.realizedPnl.toFixed(2)}, unrealized: $${report.unrealizedPnl.toFixed(2)})`,
  };
}

/**
 * Get PnL history (daily snapshots)
 */
export function getPnlHistory(params?: { days?: number }) {
  return {
    history: getPnLHistory(params?.days || 30),
    message: "PnL history snapshots.",
  };
}

/**
 * Take a manual PnL snapshot
 */
export function takePnlSnapshot() {
  savePnLSnapshot();
  return { status: "ok", message: "PnL snapshot saved." };
}

/**
 * poly-master-risk: View/modify risk parameters
 */
export function manageRisk(params?: {
  stopLossPercent?: number;
  takeProfitPercent?: number;
  maxPositionPerMarket?: number;
  maxTotalPosition?: number;
  maxSlippagePercent?: number;
}) {
  if (params && Object.keys(params).length > 0) {
    const updates: Record<string, number> = {};
    if (params.stopLossPercent !== undefined)
      updates.stop_loss_percent = params.stopLossPercent;
    if (params.takeProfitPercent !== undefined)
      updates.take_profit_percent = params.takeProfitPercent;
    if (params.maxPositionPerMarket !== undefined)
      updates.max_position_per_market = params.maxPositionPerMarket;
    if (params.maxTotalPosition !== undefined)
      updates.max_total_position = params.maxTotalPosition;
    if (params.maxSlippagePercent !== undefined)
      updates.max_slippage_percent = params.maxSlippagePercent;

    db.updateRiskConfig(updates);
  }

  const risk = db.getRiskConfig();
  return {
    stopLossPercent: risk.stop_loss_percent,
    takeProfitPercent: risk.take_profit_percent,
    maxPositionPerMarket: risk.max_position_per_market,
    maxTotalPosition: risk.max_total_position,
    maxSlippagePercent: risk.max_slippage_percent,
    message: params
      ? "Risk parameters updated."
      : "Current risk parameters.",
  };
}

/**
 * Unfollow a trader
 */
export function unfollowTrader(params: { address: string }) {
  db.removeTrader(params.address);
  return {
    status: "ok",
    message: `Unfollowed ${params.address.slice(0, 8)}...`,
  };
}

/**
 * Cleanup on shutdown
 */
export function shutdown(): void {
  if (engine) engine.stop();
  if (riskMonitor) riskMonitor.stop();
  db.closeDb();
}
