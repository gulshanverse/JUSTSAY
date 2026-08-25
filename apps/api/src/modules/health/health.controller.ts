export class HealthController {
  public getHealth() {
    return {
      status: 'ok',
      service: 'justsay-api',
      timestamp: new Date().toISOString(),
      database: 'connected',
      redis: 'ready'
    };
  }
}
