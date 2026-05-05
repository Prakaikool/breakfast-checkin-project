// ===========================================
// RATE LIMITER - Sliding window, in-memory
// ===========================================
// Prevents brute-force attacks on login and
// other sensitive endpoints.

interface Window {
  count: number;
  windowStart: number;
}

const store = new Map<string, Window>();

// Clean up expired windows every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, win] of store) {
    if (now - win.windowStart > 15 * 60 * 1000) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
}

/**
 * Check whether `key` is within the allowed rate.
 * Records each call as an attempt regardless of success.
 * @param key       Typically IP address or email
 * @param max       Max attempts allowed in the window
 * @param windowMs  Window duration in milliseconds
 */
export function checkRateLimit(
  key: string,
  max: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const win = store.get(key);

  if (!win || now - win.windowStart >= windowMs) {
    store.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: max - 1, retryAfterMs: 0 };
  }

  if (win.count >= max) {
    const retryAfterMs = windowMs - (now - win.windowStart);
    return { allowed: false, remaining: 0, retryAfterMs };
  }

  win.count++;
  return { allowed: true, remaining: max - win.count, retryAfterMs: 0 };
}

export function resetRateLimit(key: string): void {
  store.delete(key);
}
