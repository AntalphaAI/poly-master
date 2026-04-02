/**
 * Poly Master — Polymarket CLOB Client Wrapper
 *
 * Wraps @polymarket/clob-client with our RemoteSigner for zero-custody trading.
 */

import { ClobClient } from "@polymarket/clob-client";
import { Side, OrderType } from "@polymarket/clob-client";
import type { TickSize, ApiKeyCreds } from "@polymarket/clob-client";
import { createRemoteSigner, type RemoteSignerOptions } from "./remote-signer.js";
import type { PolyMasterConfig, SignRequest } from "./types.js";

// Re-export for convenience
export { Side, OrderType };

const CLOB_HOST = "https://clob.polymarket.com";
const CHAIN_ID = 137; // Polygon mainnet

export interface ClobManagerOptions {
  walletAddress: string;
  serverUrl: string;
  /** Callback when user needs to sign an order */
  onSignRequest: (req: SignRequest, signUrl: string) => void;
}

export class ClobManager {
  private client: ClobClient;
  private readonlyClient: ClobClient;

  constructor(options: ClobManagerOptions) {
    const signer = createRemoteSigner({
      walletAddress: options.walletAddress,
      serverUrl: options.serverUrl,
      onSignRequest: options.onSignRequest,
    });

    // Main client with signer (for orders that need signing)
    this.client = new ClobClient(CLOB_HOST, CHAIN_ID, signer as any);

    // Readonly client (for market data queries, no signer needed)
    this.readonlyClient = new ClobClient(CLOB_HOST, CHAIN_ID);
  }

  // ============================================================
  // Market Data (no auth required)
  // ============================================================

  /** Check API health */
  async healthCheck(): Promise<boolean> {
    try {
      await this.readonlyClient.getOk();
      return true;
    } catch {
      return false;
    }
  }

  /** Get server time */
  async getServerTime(): Promise<number> {
    return this.readonlyClient.getServerTime();
  }

  /** Get market info */
  async getMarket(conditionId: string) {
    return this.readonlyClient.getMarket(conditionId);
  }

  /** Get order book for a token */
  async getOrderBook(tokenId: string) {
    return this.readonlyClient.getOrderBook(tokenId);
  }

  /** Get midpoint price */
  async getMidpoint(tokenId: string) {
    return this.readonlyClient.getMidpoint(tokenId);
  }

  /** Get last trade price */
  async getLastTradePrice(tokenId: string) {
    return this.readonlyClient.getLastTradePrice(tokenId);
  }

  /** Get price for a specific side */
  async getPrice(tokenId: string, side: "buy" | "sell") {
    return this.readonlyClient.getPrice(tokenId, side);
  }

  /** Browse markets (paginated) */
  async getMarkets(nextCursor?: string) {
    return this.readonlyClient.getMarkets(nextCursor);
  }

  /** Get price history */
  async getPriceHistory(params: { tokenID: string; startTs?: number; endTs?: number; fidelity?: number }) {
    return this.readonlyClient.getPricesHistory(params);
  }

  // ============================================================
  // Trading (requires signer + API creds)
  // ============================================================

  /**
   * Derive or create API credentials from wallet signature.
   * This triggers a signing request to the user's wallet.
   */
  async deriveApiCreds() {
    return this.client.createOrDeriveApiKey();
  }

  /**
   * Set API credentials (after deriving or loading from storage)
   */
  setApiCreds(creds: ApiKeyCreds) {
    // Create a new client with creds
    const signer = (this.client as any).signer;
    this.client = new ClobClient(CLOB_HOST, CHAIN_ID, signer, creds);
  }

  /**
   * Create and post a limit order.
   * This will trigger a signing request to the user's wallet via the hosted page.
   */
  async createOrder(params: {
    tokenId: string;
    price: number;
    size: number;
    side: Side;
    orderType?: OrderType;
    tickSize?: TickSize;
    negRisk?: boolean;
  }) {
    const {
      tokenId,
      price,
      size,
      side,
      orderType = OrderType.GTC,
      tickSize = "0.01",
      negRisk = false,
    } = params;

    return this.client.createAndPostOrder(
      { tokenID: tokenId, price, size, side },
      { tickSize, negRisk },
      orderType as OrderType.GTC | OrderType.GTD,
    );
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: string) {
    return this.client.cancelOrder({ orderID: orderId });
  }

  /**
   * Cancel all orders for a market
   */
  async cancelMarketOrders(params: { market?: string; asset_id?: string }) {
    return this.client.cancelMarketOrders(params);
  }

  /**
   * Get open orders
   */
  async getOpenOrders(params?: { market?: string; asset_id?: string }) {
    return this.client.getOpenOrders(params);
  }

  /**
   * Get trade history
   */
  async getTrades(params?: { market?: string; asset_id?: string; maker_address?: string }) {
    return this.client.getTrades(params);
  }

  /**
   * Get balance and allowance for a token
   */
  async getBalanceAllowance(params: { asset_type: "COLLATERAL" | "CONDITIONAL"; token_id?: string }) {
    return this.client.getBalanceAllowance(params as any);
  }
}
