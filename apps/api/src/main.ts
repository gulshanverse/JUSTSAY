import { HealthController } from './modules/health/health.controller';
import { MessagesController } from './modules/messages/messages.controller';
import { AdminController } from './modules/admin/admin.controller';

console.log('Starting JUSTSAY Backend API Gateway (Modular Monolith) v1.0.0...');
console.log('API routes initialized under /api/v1/');

export class JustSayApiServer {
  private healthController = new HealthController();
  private messagesController = new MessagesController();
  private adminController = new AdminController();

  public getStatus() {
    return {
      status: 'UP',
      modules: ['health', 'auth', 'users', 'profiles', 'messages', 'moderation', 'media', 'cards', 'notifications', 'admin', 'feature-flags', 'analytics'],
      version: 'v1'
    };
  }
}
