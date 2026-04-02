/**
 * Poly Master — Error Handling & Retry Logic
 */

// ============================================================
// Custom Error Types
// ============================================================

export class PolyMasterError extends Error {
  constructor(
    message: string,
    public code: string,
    public recoverable: boolean = false,
  ) {
    super(message);
    this.name = "PolyMasterError";
  }
}

export class ClobApiError extends PolyMasterError {
  constructor(
    message: string,
    public statusCode?: number,
  ) {
    super(message, "CLOB_API_ERROR", statusCode === 429 || statusCode === 503);
  }
}

export class SigningError extends PolyMasterError {
  constructor(message: string) {
    super(message, "SIGNING_ERROR", false);
  }
}

export class RiskLimitError extends PolyMasterError {
  constructor(message: string) {
    super(message, "RISK_LIMIT", false);
  }
}

export class ConfigError extends PolyMasterError {
  constructor(message: string) {
    super(message, "CONFIG_ERROR", false);
  }
}

// ============================================================
// Retry Logic
// ============================================================

export interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  /** Only retry if this returns true */
  shouldRetry?: (error: unknown) => boolean;
}

const DEFAULT_RETRY: Required<RetryOptions> = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30_000,
  shouldRetry: (err) => err instanceof PolyMasterError && err.recoverable,
};

/**
 * Execute a function with exponential backoff retry
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: RetryOptions,
): Promise<T> {
  const opts = { ...DEFAULT_RETRY, ...options };
  let lastError: unknown;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      if (attempt === opts.maxRetries || !opts.shouldRetry(err)) {
        throw err;
      }

      // Exponential backoff with jitter
      const delay = Math.min(
        opts.baseDelayMs * Math.pow(2, attempt) + Math.random() * 1000,
        opts.maxDelayMs,
      );
      console.log(
        `[poly-master] Retry ${attempt + 1}/${opts.maxRetries} after ${Math.round(delay)}ms: ${err instanceof Error ? err.message : String(err)}`,
      );
      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Wrap an async function to catch and normalize errors
 */
export function wrapToolCall<T>(
  toolName: string,
  fn: () => Promise<T>,
): Promise<T> {
  return fn().catch((err) => {
    // Normalize error for MCP response
    if (err instanceof PolyMasterError) {
      throw err;
    }
    // Unknown errors
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[poly-master] [${toolName}] Unexpected error:`, message);
    throw new PolyMasterError(
      `${toolName} failed: ${message}`,
      "UNKNOWN_ERROR",
      false,
    );
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
