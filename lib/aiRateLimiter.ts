/**
 * Per-user AI rate limiter — 20 requests per hour per authenticated user.
 *
 * Uses an in-memory sliding-window store keyed by user id. Suitable for
 * single-instance deployments; for multi-instance, swap the store with Redis
 * or use a DB token bucket.
 */

const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS = 20;

interface UserBucket {
  timestamps: number[];
}

const store = new Map<string, UserBucket>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  limit: number;
}

export function checkAIRateLimit(userId: string): RateLimitResult {
  if (!userId) {
    return { allowed: true, remaining: MAX_REQUESTS, resetAt: Date.now() + WINDOW_MS, limit: MAX_REQUESTS };
  }
  const now = Date.now();
  const bucket = store.get(userId) || { timestamps: [] };
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < WINDOW_MS);

  const allowed = bucket.timestamps.length < MAX_REQUESTS;
  if (allowed) {
    bucket.timestamps.push(now);
  }
  store.set(userId, bucket);

  const remaining = Math.max(0, MAX_REQUESTS - bucket.timestamps.length);
  const resetAt = bucket.timestamps.length > 0 ? bucket.timestamps[0] + WINDOW_MS : now + WINDOW_MS;

  return { allowed, remaining, resetAt, limit: MAX_REQUESTS };
}

/**
 * Convenience wrapper: returns null if allowed, or a NextResponse with 429 if not.
 */
export async function enforceAIRateLimit(userId: string): Promise<Response | null> {
  const result = checkAIRateLimit(userId);
  if (result.allowed) return null;
  return new Response(
    JSON.stringify({
      error: 'AI rate limit exceeded. Limit is 20 per hour.',
      remaining: result.remaining,
      resetAt: new Date(result.resetAt).toISOString(),
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': String(result.limit),
        'X-RateLimit-Remaining': String(result.remaining),
        'X-RateLimit-Reset': String(Math.floor(result.resetAt / 1000)),
        'Retry-After': String(Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000))),
      },
    }
  );
}
