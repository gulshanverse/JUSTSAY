import { AnalyticsEventDto } from '@justsay/shared-types';

export interface FunnelStepMetric {
  step: string;
  count: number;
  conversionRatePercentage: number;
}

export class AnalyticsService {
  private events: AnalyticsEventDto[] = [];
  private forbiddenKeys = new Set(['messageText', 'replyText', 'password', 'token', 'email', 'ip', 'fingerprint', 'location']);

  public trackEvent(eventName: string, properties?: Record<string, any>): AnalyticsEventDto {
    const sanitizedProps: Record<string, any> = {};

    if (properties) {
      for (const [k, v] of Object.entries(properties)) {
        if (!this.forbiddenKeys.has(k)) {
          sanitizedProps[k] = v;
        }
      }
    }

    const event: AnalyticsEventDto = {
      eventName,
      properties: sanitizedProps,
      timestamp: Date.now()
    };

    this.events.push(event);
    if (this.events.length > 5000) {
      this.events.shift(); // Keep buffer manageable in memory
    }

    return event;
  }

  public getEventsCount(eventName?: string): number {
    if (!eventName) return this.events.length;
    return this.events.filter(e => e.eventName === eventName).length;
  }

  public getFunnelMetrics(): FunnelStepMetric[] {
    const funnelSequence = [
      { key: 'profile_created', label: '1. Profile Created' },
      { key: 'link_shared', label: '2. Link Shared' },
      { key: 'public_profile_viewed', label: '3. Profile Visited' },
      { key: 'message_sent', label: '4. Message Sent' },
      { key: 'message_opened', label: '5. Message Opened' },
      { key: 'card_created', label: '6. Card Created' },
      { key: 'card_shared', label: '7. Card Shared' }
    ];

    let baseline = 0;
    return funnelSequence.map((step, idx) => {
      const count = this.getEventsCount(step.key);
      if (idx === 0) baseline = count;

      const conversionRate = baseline > 0 ? Math.round((count / baseline) * 100) : 0;
      return {
        step: step.label,
        count,
        conversionRatePercentage: conversionRate
      };
    });
  }
}
