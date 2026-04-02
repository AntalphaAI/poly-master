/**
 * RemoteSigner — ClobSigner proxy that delegates signing to a hosted page.
 *
 * Instead of holding a private key, this class:
 * 1. Creates a sign request with the typed data
 * 2. Returns a URL where the user can sign with their wallet
 * 3. Waits for the signature to be submitted via callback
 *
 * This preserves the zero-custody model: private key never leaves the user's wallet.
 */

import crypto from "node:crypto";
import type { SignRequest } from "./types.js";

type TypedDataDomain = Record<string, unknown>;
type TypedDataTypes = Record<string, Array<{ name: string; type: string }>>;
type TypedDataValue = Record<string, unknown>;

/** Pending sign requests, keyed by request ID */
const pendingRequests = new Map<string, SignRequest>();

/** Resolve functions for pending requests */
const pendingResolvers = new Map<
  string,
  { resolve: (sig: string) => void; reject: (err: Error) => void }
>();

/**
 * Get a pending sign request by ID (used by Express routes)
 */
export function getSignRequest(id: string): SignRequest | undefined {
  return pendingRequests.get(id);
}

/**
 * Submit a signature for a pending request (called from Express callback)
 */
export function submitSignature(
  id: string,
  signature: string,
): boolean {
  const req = pendingRequests.get(id);
  if (!req || req.status !== "pending") return false;

  req.status = "signed";
  req.signature = signature;
  pendingRequests.set(id, req);

  const resolver = pendingResolvers.get(id);
  if (resolver) {
    resolver.resolve(signature);
    pendingResolvers.delete(id);
  }
  return true;
}

/**
 * Reject a pending sign request
 */
export function rejectSignRequest(id: string): boolean {
  const req = pendingRequests.get(id);
  if (!req || req.status !== "pending") return false;

  req.status = "rejected";
  pendingRequests.set(id, req);

  const resolver = pendingResolvers.get(id);
  if (resolver) {
    resolver.reject(new Error("User rejected signing request"));
    pendingResolvers.delete(id);
  }
  return true;
}

/**
 * Inject a sign request directly (for testing / demo purposes)
 */
export function injectSignRequest(req: SignRequest): void {
  pendingRequests.set(req.id, req);
}

/**
 * Clean up expired requests (call periodically)
 */
export function cleanupExpiredRequests(): void {
  const now = Date.now();
  for (const [id, req] of pendingRequests) {
    if (req.expiresAt < now && req.status === "pending") {
      req.status = "expired";
      const resolver = pendingResolvers.get(id);
      if (resolver) {
        resolver.reject(new Error("Sign request expired"));
        pendingResolvers.delete(id);
      }
      pendingRequests.delete(id);
    }
  }
}

export interface RemoteSignerOptions {
  walletAddress: string;
  serverUrl: string;
  /** Sign request TTL in ms (default: 5 minutes) */
  requestTtlMs?: number;
  /** Callback when a new sign request is created (e.g. to notify user) */
  onSignRequest?: (req: SignRequest, signUrl: string) => void;
}

/**
 * Creates a ClobSigner-compatible object that delegates signing to a remote page.
 * Implements the EthersSigner interface: _signTypedData() + getAddress()
 */
export function createRemoteSigner(options: RemoteSignerOptions) {
  const { walletAddress, serverUrl, requestTtlMs = 5 * 60 * 1000, onSignRequest } = options;

  return {
    async getAddress(): Promise<string> {
      return walletAddress;
    },

    async _signTypedData(
      domain: TypedDataDomain,
      types: TypedDataTypes,
      value: TypedDataValue,
    ): Promise<string> {
      const id = crypto.randomUUID();
      const now = Date.now();

      const signRequest: SignRequest = {
        id,
        domain,
        types,
        value,
        primaryType: Object.keys(types).find((k) => k !== "EIP712Domain") || "Order",
        orderSummary: extractOrderSummary(value),
        status: "pending",
        createdAt: now,
        expiresAt: now + requestTtlMs,
      };

      pendingRequests.set(id, signRequest);

      const signUrl = `${serverUrl}/sign/${id}`;

      // Notify the caller (e.g. send Slack message with sign URL)
      if (onSignRequest) {
        onSignRequest(signRequest, signUrl);
      }

      // Wait for the signature to come back
      return new Promise<string>((resolve, reject) => {
        pendingResolvers.set(id, { resolve, reject });

        // Auto-expire
        setTimeout(() => {
          if (pendingRequests.get(id)?.status === "pending") {
            rejectSignRequest(id);
          }
        }, requestTtlMs);
      });
    },
  };
}

/**
 * Extract human-readable order summary from EIP-712 typed data value
 */
function extractOrderSummary(value: TypedDataValue): SignRequest["orderSummary"] {
  // Polymarket Order struct fields
  const side = value.side === 0 || value.side === "0" ? "BUY" : "SELL";
  const makerAmount = Number(value.makerAmount || 0);
  const takerAmount = Number(value.takerAmount || 0);

  // For a BUY: makerAmount = USDC to spend, takerAmount = tokens to receive
  // Price ≈ makerAmount / takerAmount
  const price =
    takerAmount > 0 ? makerAmount / takerAmount : 0;
  const size = side === "BUY" ? takerAmount : makerAmount;
  const total = side === "BUY" ? makerAmount : takerAmount;

  return {
    market: String(value.tokenId || "unknown"),
    side,
    price: Math.round(price * 10000) / 10000,
    size: size / 1e6, // USDC has 6 decimals
    total: total / 1e6,
  };
}
