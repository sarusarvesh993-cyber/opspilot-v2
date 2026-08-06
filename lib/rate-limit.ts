const DEFAULT_LIMIT = 10;
const DEFAULT_WINDOW_MS = 60_000;
const MAX_BUCKETS = 10_000;

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
}

const globalStore = globalThis as typeof globalThis & {
  __opspilotRateLimitBuckets?: Map<string, RateLimitBucket>;
};

const buckets =
  globalStore.__opspilotRateLimitBuckets ?? new Map<string, RateLimitBucket>();
globalStore.__opspilotRateLimitBuckets = buckets;

function removeExpiredBuckets(now: number): void {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

export function consumeRateLimit(
  identifier: string,
  now = Date.now(),
  limit = DEFAULT_LIMIT,
  windowMs = DEFAULT_WINDOW_MS,
): RateLimitResult {
  if (buckets.size >= MAX_BUCKETS) {
    removeExpiredBuckets(now);
    if (buckets.size >= MAX_BUCKETS) {
      const oldestKey = buckets.keys().next().value;
      if (typeof oldestKey === "string") buckets.delete(oldestKey);
    }
  }

  const current = buckets.get(identifier);
  const bucket =
    current && current.resetAt > now
      ? current
      : { count: 0, resetAt: now + windowMs };

  bucket.count += 1;
  buckets.set(identifier, bucket);

  const remaining = Math.max(0, limit - bucket.count);
  const allowed = bucket.count <= limit;

  return {
    allowed,
    limit,
    remaining,
    resetAt: bucket.resetAt,
    retryAfterSeconds: allowed
      ? 0
      : Math.max(1, Math.ceil((bucket.resetAt - now) / 1_000)),
  };
}

export function getClientIdentifier(headers: Headers): string {
  const forwardedFor = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = headers.get("x-real-ip")?.trim();
  return forwardedFor || realIp || "unknown-client";
}

export function clearRateLimitBucketsForTests(): void {
  buckets.clear();
}
