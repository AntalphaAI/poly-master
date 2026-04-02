/**
 * Poly Master — Express server for hosted signing pages
 *
 * Routes:
 *   GET  /sign/:id          — Signing page (user opens in wallet browser)
 *   POST /sign/:id/submit   — Callback to receive signature
 *   POST /sign/:id/reject   — User rejects the request
 *   GET  /health             — Health check
 */

import express from "express";
import crypto from "node:crypto";
import { getSignRequest, submitSignature, rejectSignRequest, injectSignRequest } from "./remote-signer.js";

export function createSignServer(port: number): express.Express {
  const app = express();
  app.use(express.json());

  // Health check
  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "poly-master-signer" });
  });

  // Signing page
  app.get("/sign/:id", (req, res) => {
    const signReq = getSignRequest(req.params.id);
    if (!signReq) {
      return res.status(404).send(notFoundPage());
    }
    if (signReq.status !== "pending") {
      return res.status(410).send(expiredPage(signReq.status));
    }
    res.send(signingPage(signReq));
  });

  // Submit signature
  app.post("/sign/:id/submit", (req, res) => {
    const { signature } = req.body;
    if (!signature || typeof signature !== "string") {
      return res.status(400).json({ error: "Missing signature" });
    }
    const ok = submitSignature(req.params.id, signature);
    if (!ok) {
      return res.status(404).json({ error: "Request not found or already processed" });
    }
    res.json({ status: "ok" });
  });

  // Test: create a demo sign request (for E2E testing)
  app.post("/test/create-order", (req, res) => {
    const id = crypto.randomUUID();
    const now = Date.now();
    const body = req.body || {};

    const side = body.side || "BUY";
    const price = body.price || 0.55;
    const size = body.size || 10;
    const total = price * size;
    const market = body.market || "Will BTC reach $200k in 2026?";

    // Polymarket CTF Exchange EIP-712 domain
    const domain = {
      name: "ClobAuthDomain",
      version: "1",
      chainId: 137,
    };

    const types = {
      Order: [
        { name: "salt", type: "uint256" },
        { name: "maker", type: "address" },
        { name: "signer", type: "address" },
        { name: "taker", type: "address" },
        { name: "tokenId", type: "uint256" },
        { name: "makerAmount", type: "uint256" },
        { name: "takerAmount", type: "uint256" },
        { name: "expiration", type: "uint256" },
        { name: "nonce", type: "uint256" },
        { name: "feeRateBps", type: "uint256" },
        { name: "side", type: "uint8" },
        { name: "signatureType", type: "uint8" },
      ],
    };

    const value = {
      salt: String(Math.floor(Math.random() * 1e18)),
      maker: body.walletAddress || "0x0000000000000000000000000000000000000000",
      signer: body.walletAddress || "0x0000000000000000000000000000000000000000",
      taker: "0x0000000000000000000000000000000000000000",
      tokenId: "71321045679252212594626385532706912750332728571942532289631379312455583992563",
      makerAmount: String(Math.floor(total * 1e6)),
      takerAmount: String(Math.floor(size * 1e6)),
      expiration: "0",
      nonce: "0",
      feeRateBps: "0",
      side: side === "BUY" ? "0" : "1",
      signatureType: "0",
    };

    const signRequest = {
      id,
      domain,
      types,
      value,
      primaryType: "Order",
      orderSummary: { market, side, price, size, total },
      status: "pending" as const,
      createdAt: now,
      expiresAt: now + 5 * 60 * 1000,
    };

    injectSignRequest(signRequest);
    const signUrl = `/sign/${id}`;

    res.json({ status: "ok", id, signUrl });
  });

  // Reject
  app.post("/sign/:id/reject", (req, res) => {
    const ok = rejectSignRequest(req.params.id);
    if (!ok) {
      return res.status(404).json({ error: "Request not found or already processed" });
    }
    res.json({ status: "rejected" });
  });

  app.listen(port, () => {
    console.log(`[poly-master] Sign server listening on port ${port}`);
  });

  return app;
}

// ============================================================
// HTML Templates (Cyberpunk style, matching web3-trader)
// ============================================================

function signingPage(req: ReturnType<typeof getSignRequest> & {}): string {
  const { orderSummary, domain, types, value, id } = req;
  const typedData = JSON.stringify({ domain, types, primaryType: req.primaryType, message: value });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Poly Master — Sign Order</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Courier New', monospace;
      background: #0a0a0a;
      color: #00ff88;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      max-width: 480px;
      width: 100%;
      background: #111;
      border: 1px solid #00ff8855;
      border-radius: 12px;
      padding: 32px 24px;
      box-shadow: 0 0 40px #00ff8822;
    }
    .logo { text-align: center; font-size: 28px; margin-bottom: 8px; }
    .title { text-align: center; font-size: 18px; color: #00ff88; margin-bottom: 24px; }
    .order-card {
      background: #1a1a2e;
      border: 1px solid #00ff8844;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
    }
    .order-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #ffffff11;
    }
    .order-row:last-child { border-bottom: none; }
    .order-label { color: #888; font-size: 13px; }
    .order-value { color: #fff; font-size: 14px; font-weight: bold; }
    .order-value.buy { color: #00ff88; }
    .order-value.sell { color: #ff4444; }
    .btn {
      width: 100%;
      padding: 16px;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
      margin-bottom: 12px;
      font-family: inherit;
    }
    .btn-sign {
      background: #00ff88;
      color: #000;
    }
    .btn-sign:hover { background: #00dd77; }
    .btn-sign:disabled { background: #444; color: #888; cursor: not-allowed; }
    .btn-reject {
      background: transparent;
      color: #ff4444;
      border: 1px solid #ff444444;
    }
    .btn-reject:hover { border-color: #ff4444; }
    .status { text-align: center; margin-top: 16px; font-size: 14px; }
    .status.success { color: #00ff88; }
    .status.error { color: #ff4444; }
    .footer {
      text-align: center;
      margin-top: 20px;
      font-size: 11px;
      color: #555;
    }
    .wallets {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-bottom: 16px;
    }
    .wallet-btn {
      padding: 12px 8px;
      background: #1a1a2e;
      border: 1px solid #00ff8833;
      border-radius: 8px;
      color: #fff;
      cursor: pointer;
      font-size: 13px;
      text-align: center;
      font-family: inherit;
    }
    .wallet-btn:hover { border-color: #00ff88; }
    .wallet-btn.selected { border-color: #00ff88; background: #00ff8811; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">🎯</div>
    <div class="title">POLY MASTER — SIGN ORDER</div>

    <div class="order-card">
      <div class="order-row">
        <span class="order-label">Action</span>
        <span class="order-value ${orderSummary.side.toLowerCase()}">${orderSummary.side}</span>
      </div>
      <div class="order-row">
        <span class="order-label">Market</span>
        <span class="order-value">${truncate(orderSummary.market, 20)}</span>
      </div>
      <div class="order-row">
        <span class="order-label">Price</span>
        <span class="order-value">$${orderSummary.price.toFixed(4)}</span>
      </div>
      <div class="order-row">
        <span class="order-label">Size</span>
        <span class="order-value">${orderSummary.size.toFixed(2)} shares</span>
      </div>
      <div class="order-row">
        <span class="order-label">Total</span>
        <span class="order-value">$${orderSummary.total.toFixed(2)} USDC</span>
      </div>
    </div>

    <div class="wallets">
      <button class="wallet-btn" onclick="connectWallet('metamask')">🦊 MetaMask</button>
      <button class="wallet-btn" onclick="connectWallet('okx')">🟢 OKX</button>
      <button class="wallet-btn" onclick="connectWallet('trust')">🔵 Trust</button>
      <button class="wallet-btn" onclick="connectWallet('tokenpocket')">🟣 TokenPocket</button>
    </div>

    <button class="btn btn-sign" id="signBtn" onclick="signOrder()" disabled>
      Connect Wallet First
    </button>
    <button class="btn btn-reject" onclick="rejectOrder()">Reject</button>

    <div class="status" id="status"></div>
    <div class="footer">Poly Master by Antalpha AI · Zero Custody</div>
  </div>

  <script>
    const TYPED_DATA = ${typedData};
    const REQUEST_ID = "${id}";
    let provider = null;
    let accounts = [];

    // Build deeplinks for wallet apps
    function getDeeplink(type) {
      const url = encodeURIComponent(window.location.href);
      const raw = window.location.href;
      switch(type) {
        case 'metamask':
          return 'https://metamask.app.link/dapp/' + raw.replace(/^https?:\\/\\//, '');
        case 'okx':
          return 'okx://wallet/dapp/details?dappUrl=' + url;
        case 'trust':
          return 'https://link.trustwallet.com/open_url?coin_id=60&url=' + url;
        case 'tokenpocket':
          return 'tpdapp://open?params=' + encodeURIComponent(JSON.stringify({url: raw, chain: 'Polygon'}));
        default:
          return null;
      }
    }

    async function connectWallet(type) {
      const statusEl = document.getElementById('status');
      const signBtn = document.getElementById('signBtn');

      // Select all wallet buttons, remove selection
      document.querySelectorAll('.wallet-btn').forEach(b => b.classList.remove('selected'));
      event.target.classList.add('selected');

      // If no injected provider, redirect to wallet deeplink
      if (typeof window.ethereum === 'undefined') {
        const deeplink = getDeeplink(type);
        if (deeplink) {
          statusEl.innerHTML = '⏳ Opening ' + type + '... If nothing happens, copy this URL and paste it in your wallet\\'s DApp browser.';
          statusEl.className = 'status error';
          window.location.href = deeplink;
          return;
        }
        statusEl.textContent = '❌ No wallet detected. Please open this link inside your wallet app\\'s built-in browser (DApp Browser).';
        statusEl.className = 'status error';
        return;
      }

      try {
        provider = window.ethereum;
        accounts = await provider.request({ method: 'eth_requestAccounts' });

        if (accounts.length > 0) {
          signBtn.disabled = false;
          signBtn.textContent = 'Sign Order (' + accounts[0].slice(0,6) + '...' + accounts[0].slice(-4) + ')';
          statusEl.textContent = '✅ Wallet connected';
          statusEl.className = 'status success';
        }
      } catch (err) {
        statusEl.textContent = 'Connection failed: ' + err.message;
        statusEl.className = 'status error';
      }
    }

    async function signOrder() {
      const statusEl = document.getElementById('status');
      const signBtn = document.getElementById('signBtn');
      try {
        signBtn.disabled = true;
        signBtn.textContent = 'Signing...';
        statusEl.textContent = 'Please confirm in your wallet...';
        statusEl.className = 'status';

        const signature = await provider.request({
          method: 'eth_signTypedData_v4',
          params: [accounts[0], JSON.stringify(TYPED_DATA)],
        });

        // Submit signature back to server
        const res = await fetch('/sign/' + REQUEST_ID + '/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ signature }),
        });

        if (res.ok) {
          statusEl.textContent = '✅ Order signed and submitted!';
          statusEl.className = 'status success';
          signBtn.textContent = 'Done';
        } else {
          throw new Error('Failed to submit signature');
        }
      } catch (err) {
        statusEl.textContent = '❌ ' + err.message;
        statusEl.className = 'status error';
        signBtn.disabled = false;
        signBtn.textContent = 'Retry Sign';
      }
    }

    async function rejectOrder() {
      await fetch('/sign/' + REQUEST_ID + '/reject', { method: 'POST' });
      document.getElementById('status').textContent = 'Order rejected.';
      document.getElementById('status').className = 'status error';
      document.getElementById('signBtn').disabled = true;
      document.getElementById('signBtn').textContent = 'Rejected';
    }
  </script>
</body>
</html>`;
}

function notFoundPage(): string {
  return `<!DOCTYPE html><html><head><title>Not Found</title>
<style>body{background:#0a0a0a;color:#ff4444;font-family:monospace;display:flex;align-items:center;justify-content:center;min-height:100vh;}
</style></head><body><h1>Sign request not found</h1></body></html>`;
}

function expiredPage(status: string): string {
  return `<!DOCTYPE html><html><head><title>Expired</title>
<style>body{background:#0a0a0a;color:#888;font-family:monospace;display:flex;align-items:center;justify-content:center;min-height:100vh;}
</style></head><body><h1>Request ${status}</h1></body></html>`;
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 3) + "..." : s;
}
