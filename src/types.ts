/**
 * Poly Master — Core Types
 */

// ============================================================
// Configuration
// ============================================================

export interface PolyMasterConfig {
  /** User's wallet address (EOA) */
  walletAddress: string;
  /** Polymarket CLOB host */
  clobHost: string;
  /** Polygon chain ID (137 for mainnet) */
  chainId: number;
  /** Signature type: 0=EOA, 1=POLY_GNOSIS_SAFE, 2=POLY_PROXY */
  signatureType: number;
  /** Express server port for signing pages */
  serverPort: number;
  /** Public URL for the signing server */
  serverUrl: string;
}

// ============================================================
// Trader Discovery
// ============================================================

export interface Trader {
  address: string;
  username?: string;
  winRate: number;
  roi: number;
  totalTrades: number;
  activeSince: string;
  topMarkets: string[];
}

// ============================================================
// Copy Trading
// ============================================================

export interface CopyConfig {
  /** Trader addresses to follow */
  traderAddresses: string[];
  /** Percentage of trader's position to copy (0-100) */
  copyRatio: number;
  /** Aggregation window in minutes */
  aggregationWindowMinutes: number;
}

export interface RiskConfig {
  /** Stop loss percentage (0-100) */
  stopLossPercent: number;
  /** Take profit percentage (0-100) */
  takeProfitPercent: number;
  /** Max position size per market in USDC */
  maxPositionPerMarket: number;
  /** Max total portfolio size in USDC */
  maxTotalPosition: number;
  /** Max slippage tolerance percentage */
  maxSlippagePercent: number;
}

// ============================================================
// Orders & Positions
// ============================================================

export interface CopyOrder {
  id: string;
  traderAddress: string;
  marketId: string;
  tokenId: string;
  side: "BUY" | "SELL";
  price: number;
  size: number;
  status: "pending_signature" | "submitted" | "matched" | "failed" | "cancelled";
  signRequestId?: string;
  orderId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Position {
  marketId: string;
  tokenId: string;
  marketTitle: string;
  side: "YES" | "NO";
  size: number;
  avgEntryPrice: number;
  currentPrice: number;
  unrealizedPnl: number;
  realizedPnl: number;
}

// ============================================================
// Signing
// ============================================================

export interface SignRequest {
  id: string;
  domain: Record<string, unknown>;
  types: Record<string, Array<{ name: string; type: string }>>;
  value: Record<string, unknown>;
  primaryType: string;
  /** Human-readable order summary */
  orderSummary: {
    market: string;
    side: string;
    price: number;
    size: number;
    total: number;
  };
  status: "pending" | "signed" | "rejected" | "expired";
  signature?: string;
  createdAt: number;
  expiresAt: number;
}

// ============================================================
// PnL
// ============================================================

export interface PnLReport {
  period: "day" | "week" | "month" | "all";
  totalPnl: number;
  realizedPnl: number;
  unrealizedPnl: number;
  totalTrades: number;
  winRate: number;
  bestTrade: { market: string; pnl: number } | null;
  worstTrade: { market: string; pnl: number } | null;
  byTrader: Array<{
    address: string;
    pnl: number;
    trades: number;
  }>;
}
