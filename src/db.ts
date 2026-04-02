/**
 * Poly Master — SQLite Database Layer
 */

import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "..", "data", "poly-master.db");

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    // Ensure data directory exists
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    initSchema(db);
  }
  return db;
}

function initSchema(db: Database.Database): void {
  db.exec(`
    -- User configuration
    CREATE TABLE IF NOT EXISTS config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000)
    );

    -- Followed traders
    CREATE TABLE IF NOT EXISTS traders (
      address TEXT PRIMARY KEY,
      username TEXT,
      copy_ratio REAL NOT NULL DEFAULT 10,
      active INTEGER NOT NULL DEFAULT 1,
      added_at INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000)
    );

    -- Copy orders
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      trader_address TEXT NOT NULL,
      market_id TEXT NOT NULL,
      token_id TEXT NOT NULL,
      side TEXT NOT NULL CHECK(side IN ('BUY','SELL')),
      price REAL NOT NULL,
      size REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending_signature',
      sign_request_id TEXT,
      polymarket_order_id TEXT,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000),
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000),
      FOREIGN KEY (trader_address) REFERENCES traders(address)
    );

    -- Positions
    CREATE TABLE IF NOT EXISTS positions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      market_id TEXT NOT NULL,
      token_id TEXT NOT NULL,
      market_title TEXT,
      side TEXT NOT NULL CHECK(side IN ('YES','NO')),
      size REAL NOT NULL,
      avg_entry_price REAL NOT NULL,
      current_price REAL DEFAULT 0,
      unrealized_pnl REAL DEFAULT 0,
      realized_pnl REAL DEFAULT 0,
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000),
      UNIQUE(market_id, token_id)
    );

    -- PnL snapshots
    CREATE TABLE IF NOT EXISTS pnl_snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      snapshot_date TEXT NOT NULL,
      total_pnl REAL NOT NULL,
      realized_pnl REAL NOT NULL,
      unrealized_pnl REAL NOT NULL,
      total_trades INTEGER NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000)
    );

    -- Risk config
    CREATE TABLE IF NOT EXISTS risk_config (
      id INTEGER PRIMARY KEY CHECK(id = 1),
      stop_loss_percent REAL NOT NULL DEFAULT 20,
      take_profit_percent REAL NOT NULL DEFAULT 50,
      max_position_per_market REAL NOT NULL DEFAULT 100,
      max_total_position REAL NOT NULL DEFAULT 1000,
      max_slippage_percent REAL NOT NULL DEFAULT 2,
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000)
    );

    -- Insert default risk config if not exists
    INSERT OR IGNORE INTO risk_config (id) VALUES (1);
  `);
}

// ============================================================
// Config helpers
// ============================================================

export function getConfig(key: string): string | undefined {
  const db = getDb();
  const row = db.prepare("SELECT value FROM config WHERE key = ?").get(key) as
    | { value: string }
    | undefined;
  return row?.value;
}

export function setConfig(key: string, value: string): void {
  const db = getDb();
  db.prepare(
    "INSERT INTO config (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = ?",
  ).run(key, value, Date.now(), value, Date.now());
}

// ============================================================
// Trader helpers
// ============================================================

export function addTrader(address: string, username?: string, copyRatio = 10): void {
  const db = getDb();
  db.prepare(
    "INSERT INTO traders (address, username, copy_ratio, added_at) VALUES (?, ?, ?, ?) ON CONFLICT(address) DO UPDATE SET username = ?, copy_ratio = ?, active = 1",
  ).run(address, username || null, copyRatio, Date.now(), username || null, copyRatio);
}

export function removeTrader(address: string): void {
  const db = getDb();
  db.prepare("UPDATE traders SET active = 0 WHERE address = ?").run(address);
}

export function getActiveTraders(): Array<{ address: string; username: string | null; copy_ratio: number }> {
  const db = getDb();
  return db.prepare("SELECT address, username, copy_ratio FROM traders WHERE active = 1").all() as any[];
}

// ============================================================
// Risk config helpers
// ============================================================

export function getRiskConfig() {
  const db = getDb();
  return db.prepare("SELECT * FROM risk_config WHERE id = 1").get() as any;
}

export function updateRiskConfig(updates: Record<string, number>): void {
  const db = getDb();
  const allowed = [
    "stop_loss_percent",
    "take_profit_percent",
    "max_position_per_market",
    "max_total_position",
    "max_slippage_percent",
  ];
  for (const [key, value] of Object.entries(updates)) {
    if (allowed.includes(key)) {
      db.prepare(`UPDATE risk_config SET ${key} = ?, updated_at = ? WHERE id = 1`).run(
        value,
        Date.now(),
      );
    }
  }
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}
