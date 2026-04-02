/**
 * Quick test script — verify CLOB API connectivity and data flow
 */

// @ts-nocheck — test script, relaxed types
import { ClobClient } from "@polymarket/clob-client";

const CLOB_HOST = "https://clob.polymarket.com";
const CHAIN_ID = 137;

async function main() {
  console.log("=== Poly Master — CLOB API Test ===\n");

  const client = new ClobClient(CLOB_HOST, CHAIN_ID);

  // 1. Health check
  console.log("1. Health check...");
  const ok = await client.getOk();
  console.log(`   ✅ CLOB API: ${ok}\n`);

  // 2. Server time
  console.log("2. Server time...");
  const time = await client.getServerTime();
  console.log(`   ✅ Server time: ${new Date(time * 1000).toISOString()}\n`);

  // 3. Markets
  console.log("3. Fetching markets...");
  const markets = await client.getMarkets();
  console.log(`   ✅ Markets available: ${markets.data?.length || 0}`);
  if (markets.data?.[0]) {
    const m = markets.data[0];
    console.log(`   First market: "${m.question?.slice(0, 60)}..."`);
    console.log(`   Tokens: ${m.tokens?.length || 0}\n`);
  }

  // 4. Order book
  if (markets.data?.[0]?.tokens?.[0]) {
    const tokenId = markets.data[0].tokens[0].token_id;
    console.log(`4. Fetching order book for token ${tokenId.slice(0, 12)}...`);
    try {
      const ob = await client.getOrderBook(tokenId);
      console.log(`   ✅ Bids: ${ob.bids?.length || 0}, Asks: ${ob.asks?.length || 0}`);
      if (ob.bids?.[0]) console.log(`   Best bid: $${ob.bids[0].price}`);
      if (ob.asks?.[0]) console.log(`   Best ask: $${ob.asks[0].price}`);
    } catch (e: any) {
      console.log(`   ⚠️ Order book: ${e.message}`);
    }
    console.log();
  }

  // 5. Data API (public trades)
  console.log("5. Fetching recent trades (data-api)...");
  const https = await import("node:https");
  const trades = await new Promise<any[]>((resolve, reject) => {
    https.get("https://data-api.polymarket.com/trades?limit=5", (res) => {
      let data = "";
      res.on("data", (d: Buffer) => (data += d));
      res.on("end", () => resolve(JSON.parse(data)));
      res.on("error", reject);
    });
  });
  console.log(`   ✅ Recent trades: ${trades.length}`);
  if (trades[0]) {
    console.log(`   Latest: ${trades[0].name || "anon"} ${trades[0].side} ${trades[0].size?.toFixed(2)} "${trades[0].title?.slice(0, 40)}..." @ $${trades[0].price?.toFixed(4)}`);
  }

  console.log("\n=== All tests passed ✅ ===");
}

main().catch((e) => {
  console.error("Test failed:", e);
  process.exit(1);
});
