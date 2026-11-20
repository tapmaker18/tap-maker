/**
 * Sliding-window rate limiter & progressive brute-force lockout store.
 * Compatible with both Next.js Edge Middleware and Node.js API routes.
 * Includes automatic LRU/TTL pruning to prevent memory exhaustion under DDoS.
 */

interface SlidingBucket {
  timestamps: number[];
  blockedUntil: number;
  strikes: number;
}

const MAX_BUCKETS = 5000;
const globalStore = globalThis as unknown as {
  __kaiaRateBuckets?: Map<string, SlidingBucket>;
};

function getStore(): Map<string, SlidingBucket> {
  if (!globalStore.__kaiaRateBuckets) {
    globalStore.__kaiaRateBuckets = new Map<string, SlidingBucket>();
  }
  return globalStore.__kaiaRateBuckets;
}

function pruneStore(store: Map<string, SlidingBucket>, now: number) {
  if (store.size <= MAX_BUCKETS) return;
  const entries = Array.from(store.entries());
  for (const [key, bucket] of entries) {
    const latest = bucket.timestamps[bucket.timestamps.length - 1] || 0;
    if (bucket.blockedUntil < now && now - latest > 15 * 60 * 1000) {
      store.delete(key);
    }
    if (store.size <= MAX_BUCKETS * 0.8) break;
  }
  // If still full during a massive flood, evict oldest inserted keys
  if (store.size > MAX_BUCKETS) {
    const keys = Array.from(store.keys());
    const toRemove = store.size - Math.floor(MAX_BUCKETS * 0.8);
    for (let i = 0; i < toRemove; i++) {
      store.delete(keys[i]);
    }
  }
}

export function getClientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first.slice(0, 64);
  }
  const realIp =
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-vercel-forwarded-for");
  if (realIp) return realIp.trim().slice(0, 64);
  return "127.0.0.1";
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  retryAfterSeconds: number;
  strikes: number;
}

/**
 * Checks and records a hit in a sliding window.
 * If progressiveLockout is true, exceeding the limit locks the bucket for
 * escalating durations (60s -> 300s -> 900s).
 */
export function checkSlidingRateLimit(params: {
  key: string;
  limit: number;
  windowMs: number;
  recordHit?: boolean;
  progressiveLockout?: boolean;
}): RateLimitResult {
  const { key, limit, windowMs, recordHit = true, progressiveLockout = false } = params;
  const now = Date.now();
  const store = getStore();
  pruneStore(store, now);

  let bucket = store.get(key);
  if (!bucket) {
    bucket = { timestamps: [], blockedUntil: 0, strikes: 0 };
    store.set(key, bucket);
  }

  // Check active lockout
  if (bucket.blockedUntil > now) {
    return {
      allowed: false,
      remaining: 0,
      limit,
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.blockedUntil - now) / 1000)),
      strikes: bucket.strikes,
    };
  }

  // Filter timestamps within sliding window
  const cutoff = now - windowMs;
  bucket.timestamps = bucket.timestamps.filter((t) => t > cutoff);

  if (bucket.timestamps.length >= limit) {
    bucket.strikes += 1;
    let lockMs = windowMs;
    if (progressiveLockout) {
      // Escalating lockout: 1st lockout = 60s, 2nd = 5 mins, 3rd+ = 15 mins
      lockMs =
        bucket.strikes === 1
          ? 60 * 1000
          : bucket.strikes === 2
          ? 5 * 60 * 1000
          : 15 * 60 * 1000;
      bucket.blockedUntil = now + lockMs;
    } else {
      const oldest = bucket.timestamps[0] || now;
      lockMs = Math.max(1000, oldest + windowMs - now);
    }

    return {
      allowed: false,
      remaining: 0,
      limit,
      retryAfterSeconds: Math.max(1, Math.ceil(lockMs / 1000)),
      strikes: bucket.strikes,
    };
  }

  if (recordHit) {
    bucket.timestamps.push(now);
    // Check if this hit just reached the progressive lockout threshold
    if (progressiveLockout && bucket.timestamps.length >= limit) {
      bucket.strikes += 1;
      const lockMs =
        bucket.strikes === 1
          ? 60 * 1000
          : bucket.strikes === 2
          ? 5 * 60 * 1000
          : 15 * 60 * 1000;
      bucket.blockedUntil = now + lockMs;
      return {
        allowed: false,
        remaining: 0,
        limit,
        retryAfterSeconds: Math.max(1, Math.ceil(lockMs / 1000)),
        strikes: bucket.strikes,
      };
    }
  }

  return {
    allowed: true,
    remaining: Math.max(0, limit - bucket.timestamps.length),
    limit,
    retryAfterSeconds: 0,
    strikes: bucket.strikes,
  };
}

export function resetRateLimitKey(key: string): void {
  getStore().delete(key);
}
