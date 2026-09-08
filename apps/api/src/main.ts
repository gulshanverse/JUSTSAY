import { HealthController } from './modules/health/health.controller';
import { MessagesController } from './modules/messages/messages.controller';
import { AdminController } from './modules/admin/admin.controller';
import { AuthService } from './modules/auth/auth.service';
import { AuthController } from './modules/auth/auth.controller';
import { HandlesController } from './modules/handles/handles.controller';
import { UsersController } from './modules/users/users.controller';
import { PublicWebController } from './modules/public/public.controller';
import { RateLimiterService } from './modules/ratelimit/ratelimit.service';
import { ServerModerationService } from './modules/moderation/moderation.service';
import { CardsController } from './modules/cards/cards.controller';
import { MediaStorageService } from './modules/media/media.service';
import { NotificationService } from './modules/notifications/notification.service';
import { FeatureFlagsService } from './modules/feature-flags/feature-flags.service';
import { AnalyticsService } from './modules/analytics/analytics.service';
import { CacheService, JobQueueService } from './modules/ratelimit/cache-redis.service';
import { AccountDataExportService } from './modules/users/data-export.service';

// Phase 7 Production Infrastructure Modules
import { loadConfig } from './config/env.config';
import { LoggerService, MetricsService } from './modules/observability/logging.service';
import { DatabaseService, MigrationRunner } from './database/database.service';
import { RedisCacheAdapter, ProductionRateLimiterService } from './modules/ratelimit/redis-production.service';
import { ProductionObjectStorageAdapter } from './modules/media/media-storage-production.service';
import { ProductionJobQueueWorker } from './modules/workers/background-worker.service';
import { FcmProvider } from './modules/notifications/fcm-production.provider';
import { ProductionHealthController } from './modules/health/health-production.controller';

console.log('Starting JUSTSAY Backend API Gateway (Modular Monolith) v1.0.0...');
console.log('API routes initialized under /api/v1/');

export class JustSayApiServer {
  public config = loadConfig();
  public logger = new LoggerService('justsay-api');
  public metricsService = new MetricsService();

  public db = new DatabaseService(this.config.database, this.logger);
  public migrationRunner = new MigrationRunner(this.db, this.logger);

  public redisAdapter = new RedisCacheAdapter(this.config.redis, this.logger);
  public prodRateLimiter = new ProductionRateLimiterService(this.redisAdapter, this.logger);

  public objectStorageAdapter = new ProductionObjectStorageAdapter(this.config.objectStorage, this.logger);
  public worker = new ProductionJobQueueWorker(this.logger);
  public fcmProvider = new FcmProvider(this.config.fcm, this.logger);
  public prodHealthController = new ProductionHealthController(this.db, this.redisAdapter, this.worker);

  public healthController = new HealthController();
  public moderationService = new ServerModerationService();
  public rateLimiter = new RateLimiterService(20, 2); // 20 max, 2 refill/sec
  public authService = new AuthService();

  public featureFlagsService = new FeatureFlagsService();
  public analyticsService = new AnalyticsService();
  public cacheService = new CacheService();
  public jobQueueService = new JobQueueService();
  public accountDataExportService = new AccountDataExportService();

  public notificationService = new NotificationService(undefined, this.fcmProvider);
  public authController = new AuthController(this.authService, this.rateLimiter);
  public handlesController = new HandlesController(this.authService, this.rateLimiter);
  public usersController = new UsersController(this.authService, this.notificationService);
  public messagesController = new MessagesController(this.moderationService, this.rateLimiter, this.authService);
  public adminController = new AdminController(this.moderationService, this.featureFlagsService, this.analyticsService, this.config.secrets.adminSecret);
  public publicWebController = new PublicWebController(this.usersController, this.messagesController);
  public cardsController = new CardsController(this.authService, this.messagesController);
  public mediaStorageService = new MediaStorageService();

  public async initialize(): Promise<void> {
    this.logger.info('Initializing JUSTSAY Production Infrastructure Services...');
    await this.db.connect();
    await this.redisAdapter.connect();
    this.logger.info('Infrastructure initialization complete.');
  }

  public async shutdown(): Promise<void> {
    this.logger.info('Initiating graceful shutdown sequence...');
    await this.db.close();
    this.logger.info('Shutdown complete.');
  }

  public getStatus() {
    return {
      status: 'UP',
      env: this.config.env,
      modules: [
        'health',
        'auth',
        'users',
        'handles',
        'profiles',
        'messages',
        'moderation',
        'ratelimit',
        'public-web',
        'admin',
        'card-studio',
        'media-storage',
        'notification-service',
        'feature-flags',
        'analytics',
        'cache-redis',
        'job-queue',
        'data-export',
        'observability',
        'database-postgres',
        'redis-cache',
        'object-storage',
        'fcm-push',
        'background-worker'
      ],
      version: 'v1.0.0'
    };
  }
}

