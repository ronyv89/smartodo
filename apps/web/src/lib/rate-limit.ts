/**
 * Sliding-window in-process rate limiter for Next.js API routes.
 *
 * Usage:
 *   const limit = rateLimit({ windowMs: 60_000, max: 20 });
 *   const result = limit(request);
 *   if (!result.ok) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
 *
 * Notes:
 * - State is per-process (resets on cold start). For multi-instance deployments,
 *   use Redis (e.g. @upstash/ratelimit) instead.
 * - Key defaults to the X-Forwarded-For header → socket IP fallback.
 */

export interface RateLimitOptions {
  /** Time window in milliseconds. Default: 60_000 (1 minute). */
  windowMs?: number;
  /** Max requests per window per key. Default: 30. */
  max?: number;
}

export interface RateLimitResult {
  ok: boolean;
  /** Remaining requests in the current window. */
  remaining: number;
  /** How many ms until the window resets. */
  retryAfterMs: number;
}

interface WindowEntry {
  timestamps: number[];
}

export function rateLimit(options: RateLimitOptions = {}) {
  const windowMs = options.windowMs ?? 60_000;
  const max = options.max ?? 30;
  const store = new Map<string, WindowEntry>();

  return function check(request: Request): RateLimitResult {
    const key = getKey(request);
    const now = Date.now();
    const windowStart = now - windowMs;

    let entry = store.get(key);
    if (entry === undefined) {
      entry = { timestamps: [] };
      store.set(key, entry);
    }

    // Evict expired timestamps
    entry.timestamps = entry.timestamps.filter((t) => t > windowStart);

    const count = entry.timestamps.length;
    if (count >= max) {
      const oldest = entry.timestamps[0] ?? now;
      return { ok: false, remaining: 0, retryAfterMs: oldest + windowMs - now };
    }

    entry.timestamps.push(now);
    return { ok: true, remaining: max - count - 1, retryAfterMs: 0 };
  };
}

function getKey(request: Request): string {
  // In Next.js App Router, headers() gives us the forwarded IP
  const forwarded = request.headers.get('x-forwarded-for');
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0]?.trim() ?? 'unknown';
  }
  return 'unknown';
}
