#!/usr/bin/env tsx
/**
 * Standalone signing server for Poly Master
 * Run: npx tsx scripts/standalone-signer.ts [port]
 * 
 * Use with cloudflared for public access:
 *   cloudflared tunnel --url http://localhost:3855
 */

import { createSignServer } from "../src/sign-server.js";
import { cleanupExpiredRequests } from "../src/remote-signer.js";

const port = parseInt(process.argv[2] || "3855", 10);

console.log(`[poly-master] Starting standalone signing server on port ${port}...`);
const app = createSignServer(port);

// Periodic cleanup
setInterval(() => {
  cleanupExpiredRequests();
}, 60_000);

console.log(`[poly-master] Sign server ready at http://localhost:${port}`);
console.log(`[poly-master] Use 'cloudflared tunnel --url http://localhost:${port}' for public access`);
