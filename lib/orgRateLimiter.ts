// Apply pass 5 — per-org AI rate limiter.
//
// PRODUCT-DECISION: use an in-memory sliding-window store keyed by org id.
// 200 calls/hr/org default. Multi-instance deployments should swap with Redis.
// Not auto-wired; call enforceOrgRateLimit() from routes that opt-in.

const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const DEFAULT_MAX = 200;

interface OrgBucket {
  timestamps: number[];
}
const store = new Map<string, OrgBucket>();

export interface OrgRateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  limit: number;
}

export function checkOrgRateLimit(orgId: string, max: number = DEFAULT_MAX): OrgRateLimitResult {
  if (!orgId) {
    return { allowed: true, remaining: max, resetAt: Date.now() + WINDOW_MS, limit: max };
  }
  const now = Date.now();
  const bucket = store.get(orgId) || { timestamps: [] };
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < WINDOW_MS);
  const allowed = bucket.timestamps.length < max;
  if (allowed) bucket.timestamps.push(now);
  store.set(orgId, bucket);
  const remaining = Math.max(0, max - bucket.timestamps.length);
  const resetAt = bucket.timestamps.length > 0 ? bucket.timestamps[0] + WINDOW_MS : now + WINDOW_MS;
  return { allowed, remaining, resetAt, limit: max };
}

export async function enforceOrgRateLimit(orgId: string, max?: number): Promise<Response | null> {
  const r = checkOrgRateLimit(orgId, max);
  if (r.allowed) return null;
  return new Response(JSON.stringify({
    error: 'Org AI rate limit exceeded',
    limit: r.limit,
    resetAt: r.resetAt,
  }), { status: 429, headers: { 'Content-Type': 'application/json' } });
}
