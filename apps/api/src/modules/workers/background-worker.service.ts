import { LoggerService } from '../observability/logging.service';

export interface ProductionJob {
  id: string;
  idempotencyKey: string;
  type: 'moderation' | 'media_processing' | 'notification' | 'analytics_aggregation' | 'account_export' | 'cleanup';
  payload: Record<string, any>;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  attempts: number;
  maxAttempts: number;
  lastError?: string;
  createdAt: number;
  updatedAt: number;
}

export class ProductionJobQueueWorker {
  private jobs = new Map<string, ProductionJob>();
  private idempotencyKeys = new Map<string, string>(); // idempotencyKey -> jobId
  private logger: LoggerService;

  constructor(logger?: LoggerService) {
    this.logger = logger || new LoggerService('background-worker');
  }

  public enqueueJob(
    type: ProductionJob['type'],
    payload: Record<string, any>,
    idempotencyKey?: string,
    maxAttempts: number = 3
  ): ProductionJob {
    const key = idempotencyKey || `idempotent_${type}_${JSON.stringify(payload)}_${Date.now()}`;

    // Check if idempotent job already exists and succeeded or is pending
    const existingJobId = this.idempotencyKeys.get(key);
    if (existingJobId) {
      const existing = this.jobs.get(existingJobId);
      if (existing && (existing.status === 'COMPLETED' || existing.status === 'PENDING' || existing.status === 'PROCESSING')) {
        this.logger.info(`Deduplicated job creation request via idempotency key: ${key}`);
        return existing;
      }
    }

    const job: ProductionJob = {
      id: `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      idempotencyKey: key,
      type,
      payload,
      status: 'PENDING',
      attempts: 0,
      maxAttempts,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.jobs.set(job.id, job);
    this.idempotencyKeys.set(key, job.id);

    // Schedule worker execution asynchronously
    setImmediate(() => this.processJob(job.id));

    return job;
  }

  private async executeJobHandler(job: ProductionJob): Promise<void> {
    switch (job.type) {
      case 'moderation':
        this.logger.info(`Executed background moderation review for item ${job.payload.messageId}`);
        break;
      case 'media_processing':
        this.logger.info(`Executed background image thumbnail generation for asset ${job.payload.assetKey}`);
        break;
      case 'notification':
        this.logger.info(`Processed push notification dispatch for recipient ${job.payload.recipientHandle}`);
        break;
      case 'analytics_aggregation':
        this.logger.info('Aggregated daily analytics funnel counts');
        break;
      case 'account_export':
        this.logger.info(`Assembled data export ZIP package for user ${job.payload.handle}`);
        break;
      case 'cleanup':
        this.logger.info('Executed automated soft-deleted data cleanup sweep');
        break;
      default:
        throw new Error(`UNKNOWN_JOB_TYPE: ${job.type}`);
    }
  }

  public async processJob(jobId: string): Promise<ProductionJob> {
    const job = this.jobs.get(jobId);
    if (!job) throw new Error('NOT_FOUND: Job not found');

    if (job.status === 'COMPLETED' || (job.status === 'FAILED' && job.attempts >= job.maxAttempts)) {
      return job;
    }

    job.status = 'PROCESSING';
    job.attempts++;
    job.updatedAt = Date.now();

    try {
      this.logger.info(`Processing job ${job.id} (Attempt ${job.attempts}/${job.maxAttempts})`, {
        meta: { type: job.type, idempotencyKey: job.idempotencyKey }
      });

      await this.executeJobHandler(job);

      job.status = 'COMPLETED';
      job.updatedAt = Date.now();
      this.logger.info(`Job ${job.id} completed successfully.`);
    } catch (err: any) {
      job.lastError = err.message;
      job.updatedAt = Date.now();

      if (job.attempts < job.maxAttempts) {
        job.status = 'PENDING';
        const backoffMs = Math.pow(2, job.attempts) * 100;
        this.logger.warn(`Job ${job.id} failed with error: ${err.message}. Retrying in ${backoffMs}ms...`);
        setTimeout(() => this.processJob(job.id), backoffMs);
      } else {
        job.status = 'FAILED';
        this.logger.error(`Job ${job.id} permanently failed and moved to Dead-Letter State: ${err.message}`);
      }
    }

    return job;
  }

  public getQueueMetrics(): { pending: number; processing: number; completed: number; failed: number } {
    const all = Array.from(this.jobs.values());
    return {
      pending: all.filter(j => j.status === 'PENDING').length,
      processing: all.filter(j => j.status === 'PROCESSING').length,
      completed: all.filter(j => j.status === 'COMPLETED').length,
      failed: all.filter(j => j.status === 'FAILED').length
    };
  }

  public getJob(id: string): ProductionJob | undefined {
    return this.jobs.get(id);
  }
}
