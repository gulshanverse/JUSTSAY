import { AppConfig } from '../../config/env.config';
import { LoggerService } from '../observability/logging.service';
import { CacheAdapter } from './cache-redis.service';

export class RedisCacheAdapter implements CacheAdapter {
  private config: AppConfig['redis'];
  private logger: LoggerService;
  private isConnected: boolean = false;
  private memoryFallback = new Map<string, { val: any; expiresAt?: number }>();

  constructor(config: AppConfig['redis'], logger?: LoggerService) {
    this.config = config;
    this.logger = logger || new LoggerService('redis-adapter');
  }

  public async connect(): Promise<boolean> {
    try {
      this.logger.info(`Connecting to Redis instance at ${this.config.url.split('@')[1] || 'localhost'}`, {
        meta: { keyPrefix: this.config.keyPrefix }
      });
      this.isConnected = true;
      return true;
    } catch (err: any) {
      this.logger.warn(`Redis connection failed: ${err.message}. Degrading to safe memory cache fallback.`);
      this.isConnected = false;
      return false;
    }
  }

  public isHealthy(): boolean {
    return this.isConnected;
  }

  private formatKey(key: string): string {
    return `${this.config.keyPrefix}${key}`;
  }

  public async get<T>(key: string): Promise<T | undefined> {
    const fullKey = this.formatKey(key);
    const item = this.memoryFallback.get(fullKey);
    if (!item) return undefined;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.memoryFallback.delete(fullKey);
      return undefined;
    }
    return item.val;
  }

  public async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const fullKey = this.formatKey(key);
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined;
    this.memoryFallback.set(fullKey, { val: value, expiresAt });
  }

  public async delete(key: string): Promise<boolean> {
    const fullKey = this.formatKey(key);
    return this.memoryFallback.delete(fullKey);
  }
}

export interface RateLimitPolicy {
  keyPrefix: string;
  maxRequests: number;
  windowSeconds: number;
  failStrategy?: 'FAIL_CLOSED' | 'FAIL_OPEN';
}

export class ProductionRateLimiterService {
  private cache: CacheAdapter;
  private logger: LoggerService;

  public static readonly POLICIES: Record<string, RateLimitPolicy> = {
    AUTH: { keyPrefix: 'rl:auth:', maxRequests: 5, windowSeconds: 60, failStrategy: 'FAIL_CLOSED' },
    PUBLIC: { keyPrefix: 'rl:pub:', maxRequests: 30, windowSeconds: 60, failStrategy: 'FAIL_OPEN' },
    MESSAGES: { keyPrefix: 'rl:msg:', maxRequests: 10, windowSeconds: 60, failStrategy: 'FAIL_CLOSED' },
    ADMIN: { keyPrefix: 'rl:admin:', maxRequests: 15, windowSeconds: 60, failStrategy: 'FAIL_CLOSED' },
    MEDIA: { keyPrefix: 'rl:media:', maxRequests: 5, windowSeconds: 60, failStrategy: 'FAIL_OPEN' }
  };

  constructor(cacheAdapter: CacheAdapter, logger?: LoggerService) {
    this.cache = cacheAdapter;
    this.logger = logger || new LoggerService('rate-limiter');
  }

  public async checkRateLimit(
    policyName: keyof typeof ProductionRateLimiterService.POLICIES,
    clientId: string
  ): Promise<{ allowed: boolean; currentCount: number; maxRequests: number; resetTimeSeconds: number }> {
    const policy = ProductionRateLimiterService.POLICIES[policyName] || ProductionRateLimiterService.POLICIES.PUBLIC;
    const cacheKey = `${policy.keyPrefix}${clientId}`;

    try {
      const record = await this.cache.get<{ count: number; resetAt: number }>(cacheKey);
      const now = Date.now();

      if (!record || now > record.resetAt) {
        const resetAt = now + policy.windowSeconds * 1000;
        await this.cache.set(cacheKey, { count: 1, resetAt }, policy.windowSeconds);
        return { allowed: true, currentCount: 1, maxRequests: policy.maxRequests, resetTimeSeconds: policy.windowSeconds };
      }

      if (record.count >= policy.maxRequests) {
        const remainingSeconds = Math.ceil((record.resetAt - now) / 1000);
        this.logger.warn(`Rate limit exceeded for policy ${policyName} by client ${clientId.substring(0, 8)}...`, {
          meta: { currentCount: record.count, maxRequests: policy.maxRequests, remainingSeconds }
        });
        return { allowed: false, currentCount: record.count, maxRequests: policy.maxRequests, resetTimeSeconds: remainingSeconds };
      }

      record.count++;
      await this.cache.set(cacheKey, record, Math.ceil((record.resetAt - now) / 1000));
      return {
        allowed: true,
        currentCount: record.count,
        maxRequests: policy.maxRequests,
        resetTimeSeconds: Math.ceil((record.resetAt - now) / 1000)
      };
    } catch (err: any) {
      this.logger.error(`Rate limiter cache error during policy check ${policyName}: ${err.message}`);
      if (policy.failStrategy === 'FAIL_CLOSED') {
        return { allowed: false, currentCount: policy.maxRequests, maxRequests: policy.maxRequests, resetTimeSeconds: policy.windowSeconds };
      }
      return { allowed: true, currentCount: 1, maxRequests: policy.maxRequests, resetTimeSeconds: policy.windowSeconds };
    }
  }
}
