export class RateLimiterService {
  private buckets = new Map<string, { tokens: number; lastRefill: number }>();
  private readonly maxTokens: number;
  private readonly refillRatePerSec: number;

  constructor(maxTokens = 10, refillRatePerSec = 1) {
    this.maxTokens = maxTokens;
    this.refillRatePerSec = refillRatePerSec;
  }

  public isAllowed(key: string): { allowed: boolean; remaining: number; retryAfterSeconds: number } {
    const now = Date.now();
    const bucket = this.buckets.get(key) || { tokens: this.maxTokens, lastRefill: now };

    const elapsedSeconds = (now - bucket.lastRefill) / 1000;
    bucket.tokens = Math.min(this.maxTokens, bucket.tokens + elapsedSeconds * this.refillRatePerSec);
    bucket.lastRefill = now;

    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      this.buckets.set(key, bucket);
      return { allowed: true, remaining: Math.floor(bucket.tokens), retryAfterSeconds: 0 };
    } else {
      this.buckets.set(key, bucket);
      const retryAfter = Math.ceil((1 - bucket.tokens) / this.refillRatePerSec);
      return { allowed: false, remaining: 0, retryAfterSeconds: retryAfter };
    }
  }
}
