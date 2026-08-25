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

console.log('Starting JUSTSAY Backend API Gateway (Modular Monolith) v1.0.0...');
console.log('API routes initialized under /api/v1/');

export class JustSayApiServer {
  public healthController = new HealthController();
  public moderationService = new ServerModerationService();
  public rateLimiter = new RateLimiterService(20, 2); // 20 max, 2 refill/sec
  public authService = new AuthService();

  public featureFlagsService = new FeatureFlagsService();
  public analyticsService = new AnalyticsService();
  public cacheService = new CacheService();
  public jobQueueService = new JobQueueService();
  public accountDataExportService = new AccountDataExportService();

  public authController = new AuthController(this.authService, this.rateLimiter);
  public handlesController = new HandlesController(this.authService, this.rateLimiter);
  public usersController = new UsersController(this.authService);
  public messagesController = new MessagesController(this.moderationService, this.rateLimiter, this.authService);
  public adminController = new AdminController(this.moderationService, this.featureFlagsService, this.analyticsService);
  public publicWebController = new PublicWebController(this.usersController, this.messagesController);
  public cardsController = new CardsController(this.authService, this.messagesController);
  public mediaStorageService = new MediaStorageService();
  public notificationService = new NotificationService();

  public getStatus() {
    return {
      status: 'UP',
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
        'data-export'
      ],
      version: 'v1.0.0'
    };
  }
}
