import { DatabaseService } from '../../database/database.service';
import { RedisCacheAdapter } from '../ratelimit/redis-production.service';
import { ProductionJobQueueWorker } from '../workers/background-worker.service';

export interface ReadinessCheckResponse {
  status: 'READY' | 'DEGRADED' | 'NOT_READY';
  timestamp: number;
  checks: {
    api: { status: 'HEALTHY' };
    database: { status: string; connected: boolean };
    redis: { status: string; connected: boolean };
    worker: { status: string; queueDepth: number };
  };
}

export class ProductionHealthController {
  constructor(
    private db?: DatabaseService,
    private redis?: RedisCacheAdapter,
    private worker?: ProductionJobQueueWorker
  ) {}

  public getLiveness() {
    return {
      status: 'HEALTHY',
      timestamp: Date.now()
    };
  }

  public getReadiness(): ReadinessCheckResponse {
    const dbConnected = this.db ? this.db.isHealthy() : true;
    const redisConnected = this.redis ? this.redis.isHealthy() : true;
    const queueMetrics = this.worker ? this.worker.getQueueMetrics() : { pending: 0, processing: 0, completed: 0, failed: 0 };

    const isReady = dbConnected && redisConnected;
    let overallStatus: 'READY' | 'DEGRADED' | 'NOT_READY' = 'READY';
    if (!dbConnected && !redisConnected) {
      overallStatus = 'NOT_READY';
    } else if (!dbConnected || !redisConnected) {
      overallStatus = 'DEGRADED';
    }

    return {
      status: overallStatus,
      timestamp: Date.now(),
      checks: {
        api: { status: 'HEALTHY' },
        database: {
          status: dbConnected ? 'HEALTHY' : 'DEGRADED (In-Memory Fallback)',
          connected: dbConnected
        },
        redis: {
          status: redisConnected ? 'HEALTHY' : 'DEGRADED (Memory Fallback)',
          connected: redisConnected
        },
        worker: {
          status: 'HEALTHY',
          queueDepth: queueMetrics.pending + queueMetrics.processing
        }
      }
    };
  }
}
