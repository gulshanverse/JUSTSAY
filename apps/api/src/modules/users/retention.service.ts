import { LoggerService } from '../observability/logging.service';

export interface RetentionPolicyConfig {
  sessionRetentionDays: number;
  messageRetentionDays: number;
  mediaRetentionDays: number;
  notificationRetentionDays: number;
  auditLogRetentionDays: number;
}

export interface CleanupResult {
  expiredSessionsCleaned: number;
  oldMessagesCleaned: number;
  expiredNotificationsCleaned: number;
  executedAt: number;
}

export class RetentionEngineService {
  private policy: RetentionPolicyConfig;
  private logger: LoggerService;

  constructor(policy?: Partial<RetentionPolicyConfig>, logger?: LoggerService) {
    this.policy = {
      sessionRetentionDays: policy?.sessionRetentionDays || 7,
      messageRetentionDays: policy?.messageRetentionDays || 90,
      mediaRetentionDays: policy?.mediaRetentionDays || 180,
      notificationRetentionDays: policy?.notificationRetentionDays || 30,
      auditLogRetentionDays: policy?.auditLogRetentionDays || 365
    };
    this.logger = logger || new LoggerService('retention-engine');
  }

  public getPolicy(): RetentionPolicyConfig {
    return { ...this.policy };
  }

  public async runScheduledCleanup(
    activeSessions: Map<string, { expiresAt: number }>,
    messagesStore?: Map<string, Array<{ id: string; timestamp: number; isRead?: boolean }>>,
    notificationsStore?: Map<string, Array<{ id: string; timestamp: number }>>
  ): Promise<CleanupResult> {
    const now = Date.now();
    let expiredSessionsCleaned = 0;
    let oldMessagesCleaned = 0;
    let expiredNotificationsCleaned = 0;

    // 1. Clean expired sessions
    for (const [tokenHash, session] of Array.from(activeSessions.entries())) {
      if (session.expiresAt <= now) {
        activeSessions.delete(tokenHash);
        expiredSessionsCleaned++;
      }
    }

    // 2. Clean messages exceeding retention threshold (e.g., > 90 days)
    if (messagesStore) {
      const messageCutoffMs = now - (this.policy.messageRetentionDays * 24 * 60 * 60 * 1000);
      for (const [handle, msgs] of Array.from(messagesStore.entries())) {
        const initialCount = msgs.length;
        const validMsgs = msgs.filter(m => m.timestamp >= messageCutoffMs);
        oldMessagesCleaned += (initialCount - validMsgs.length);
        messagesStore.set(handle, validMsgs);
      }
    }

    // 3. Clean old notifications (e.g., > 30 days)
    if (notificationsStore) {
      const notifCutoffMs = now - (this.policy.notificationRetentionDays * 24 * 60 * 60 * 1000);
      for (const [handle, notifs] of Array.from(notificationsStore.entries())) {
        const initialCount = notifs.length;
        const validNotifs = notifs.filter(n => n.timestamp >= notifCutoffMs);
        expiredNotificationsCleaned += (initialCount - validNotifs.length);
        notificationsStore.set(handle, validNotifs);
      }
    }

    const result: CleanupResult = {
      expiredSessionsCleaned,
      oldMessagesCleaned,
      expiredNotificationsCleaned,
      executedAt: now
    };

    this.logger.info(`Retention cleanup sweep complete`, { meta: result as any });
    return result;
  }
}
