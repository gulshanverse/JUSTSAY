export interface CacheAdapter {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  delete(key: string): Promise<boolean>;
}

export class MemoryCacheAdapter implements CacheAdapter {
  private cache = new Map<string, { val: any; expiresAt?: number }>();

  public async get<T>(key: string): Promise<T | undefined> {
    const item = this.cache.get(key);
    if (!item) return undefined;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }
    return item.val;
  }

  public async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined;
    this.cache.set(key, { val: value, expiresAt });
  }

  public async delete(key: string): Promise<boolean> {
    return this.cache.delete(key);
  }
}

export class ProductionRedisCacheAdapter implements CacheAdapter {
  private isConnected: boolean;

  constructor(isConnected: boolean = false) {
    this.isConnected = isConnected;
  }

  public async get<T>(key: string): Promise<T | undefined> {
    if (!this.isConnected) return undefined;
    return undefined; // Would connect to Redis client in production setup
  }

  public async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    if (!this.isConnected) return;
  }

  public async delete(key: string): Promise<boolean> {
    return this.isConnected;
  }
}

export class CacheService {
  private adapter: CacheAdapter;

  constructor(adapter?: CacheAdapter) {
    this.adapter = adapter || new MemoryCacheAdapter();
  }

  public getAdapterType(): string {
    return this.adapter instanceof ProductionRedisCacheAdapter ? 'Redis' : 'Memory';
  }

  public async get<T>(key: string): Promise<T | undefined> {
    return this.adapter.get<T>(key);
  }

  public async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    return this.adapter.set<T>(key, value, ttlSeconds);
  }

  public async delete(key: string): Promise<boolean> {
    return this.adapter.delete(key);
  }
}

export interface BackgroundJob {
  id: string;
  type: 'moderation' | 'media_processing' | 'notification' | 'analytics_aggregation' | 'data_export';
  payload: Record<string, any>;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  createdAt: number;
}

export class JobQueueService {
  private jobs: BackgroundJob[] = [];

  public enqueueJob(type: BackgroundJob['type'], payload: Record<string, any>): BackgroundJob {
    const job: BackgroundJob = {
      id: `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type,
      payload,
      status: 'PENDING',
      createdAt: Date.now()
    };
    this.jobs.push(job);
    // Process asynchronously without blocking
    setImmediate(() => this.processJob(job));
    return job;
  }

  private async processJob(job: BackgroundJob) {
    job.status = 'PROCESSING';
    try {
      // Execute background task logic based on type
      job.status = 'COMPLETED';
    } catch (err) {
      job.status = 'FAILED';
    }
  }

  public getPendingJobsCount(): number {
    return this.jobs.filter(j => j.status === 'PENDING' || j.status === 'PROCESSING').length;
  }
}
