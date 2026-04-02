/**
 * Poly Master — Trade Monitor
 *
 * Monitors trades by followed traders using Polymarket's public data API.
 * Polls `data-api.polymarket.com/trades` for new activity.
 */

import https from "node:https";

const DATA_API = "https://data-api.polymarket.com";

export interface PolyTrade {
  proxyWallet: string;
  side: "BUY" | "SELL";
  asset: string;
  conditionId: string;
  size: number;
  price: number;
  timestamp: number;
  title: string;
  slug: string;
  outcome: string;
  outcomeIndex: number;
  name: string;
  pseudonym: string;
  transactionHash: string;
}

/**
 * Fetch recent trades for a specific address
 */
export async function getTradesByAddress(
  address: string,
  limit = 20,
): Promise<PolyTrade[]> {
  const url = `${DATA_API}/trades?proxyWallet=${address}&limit=${limit}`;
  return fetchJson<PolyTrade[]>(url);
}

/**
 * Fetch recent trades globally
 */
export async function getRecentTrades(limit = 50): Promise<PolyTrade[]> {
  const url = `${DATA_API}/trades?limit=${limit}`;
  return fetchJson<PolyTrade[]>(url);
}

/**
 * Fetch trades after a specific timestamp for an address
 */
export async function getNewTrades(
  address: string,
  afterTimestamp: number,
  limit = 50,
): Promise<PolyTrade[]> {
  const trades = await getTradesByAddress(address, limit);
  return trades.filter((t) => t.timestamp > afterTimestamp);
}

// ============================================================
// Trade Monitor (polling-based)
// ============================================================

export interface TradeMonitorOptions {
  /** Addresses to monitor */
  addresses: string[];
  /** Poll interval in ms (default: 30s) */
  pollIntervalMs?: number;
  /** Callback when new trades are detected */
  onNewTrades: (trades: PolyTrade[]) => void;
  /** Callback on error */
  onError?: (error: Error) => void;
}

export class TradeMonitor {
  private addresses: Set<string>;
  private pollIntervalMs: number;
  private onNewTrades: (trades: PolyTrade[]) => void;
  private onError: (error: Error) => void;
  private lastSeen: Map<string, number>; // address → last seen timestamp
  private timer: ReturnType<typeof setInterval> | null = null;
  private running = false;

  constructor(options: TradeMonitorOptions) {
    this.addresses = new Set(options.addresses.map((a) => a.toLowerCase()));
    this.pollIntervalMs = options.pollIntervalMs || 30_000;
    this.onNewTrades = options.onNewTrades;
    this.onError = options.onError || console.error;
    this.lastSeen = new Map();

    // Initialize lastSeen to now (don't replay old trades)
    const now = Math.floor(Date.now() / 1000);
    for (const addr of this.addresses) {
      this.lastSeen.set(addr, now);
    }
  }

  /** Start monitoring */
  start(): void {
    if (this.running) return;
    this.running = true;
    console.log(
      `[poly-master] Trade monitor started, watching ${this.addresses.size} addresses, polling every ${this.pollIntervalMs / 1000}s`,
    );

    // Initial poll
    this.poll();
    this.timer = setInterval(() => this.poll(), this.pollIntervalMs);
  }

  /** Stop monitoring */
  stop(): void {
    this.running = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    console.log("[poly-master] Trade monitor stopped");
  }

  /** Add an address to monitor */
  addAddress(address: string): void {
    const addr = address.toLowerCase();
    if (!this.addresses.has(addr)) {
      this.addresses.add(addr);
      this.lastSeen.set(addr, Math.floor(Date.now() / 1000));
      console.log(`[poly-master] Now monitoring ${addr}`);
    }
  }

  /** Remove an address from monitoring */
  removeAddress(address: string): void {
    const addr = address.toLowerCase();
    this.addresses.delete(addr);
    this.lastSeen.delete(addr);
  }

  /** Get monitored addresses */
  getAddresses(): string[] {
    return Array.from(this.addresses);
  }

  /** Is the monitor running? */
  isRunning(): boolean {
    return this.running;
  }

  /** Single poll cycle */
  private async poll(): Promise<void> {
    for (const address of this.addresses) {
      try {
        const lastTs = this.lastSeen.get(address) || 0;
        const newTrades = await getNewTrades(address, lastTs);

        if (newTrades.length > 0) {
          // Update last seen timestamp
          const maxTs = Math.max(...newTrades.map((t) => t.timestamp));
          this.lastSeen.set(address, maxTs);

          this.onNewTrades(newTrades);
        }
      } catch (err) {
        this.onError(
          err instanceof Error ? err : new Error(String(err)),
        );
      }
    }
  }
}

// ============================================================
// Trader Discovery (aggregate from recent trades)
// ============================================================

export interface TraderProfile {
  address: string;
  name: string;
  pseudonym: string;
  tradeCount: number;
  totalVolume: number;
  avgTradeSize: number;
  markets: Set<string>;
  lastActive: number;
}

/**
 * Discover active traders by analyzing recent trades.
 * Since there's no public leaderboard API, we aggregate from trade data.
 */
export async function discoverTraders(
  sampleSize = 500,
  minTrades = 5,
): Promise<TraderProfile[]> {
  // Fetch a large sample of recent trades
  const trades = await getRecentTrades(Math.min(sampleSize, 500));

  // Aggregate by trader
  const traderMap = new Map<string, TraderProfile>();

  for (const trade of trades) {
    const addr = trade.proxyWallet.toLowerCase();
    let profile = traderMap.get(addr);
    if (!profile) {
      profile = {
        address: addr,
        name: trade.name || "",
        pseudonym: trade.pseudonym || "",
        tradeCount: 0,
        totalVolume: 0,
        avgTradeSize: 0,
        markets: new Set(),
        lastActive: 0,
      };
      traderMap.set(addr, profile);
    }

    profile.tradeCount++;
    profile.totalVolume += trade.size * trade.price;
    profile.markets.add(trade.conditionId);
    profile.lastActive = Math.max(profile.lastActive, trade.timestamp);
  }

  // Calculate averages and filter
  const traders = Array.from(traderMap.values())
    .filter((t) => t.tradeCount >= minTrades)
    .map((t) => ({
      ...t,
      avgTradeSize: t.totalVolume / t.tradeCount,
    }))
    .sort((a, b) => b.totalVolume - a.totalVolume);

  return traders;
}

// ============================================================
// HTTP Helper
// ============================================================

function fetchJson<T>(url: string): Promise<T> {
  return new Promise((resolve, reject) => {
    https
      .get(url, { timeout: 10_000 }, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} from ${url}`));
          res.resume();
          return;
        }
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error(`JSON parse error: ${(e as Error).message}`));
          }
        });
      })
      .on("error", reject);
  });
}
