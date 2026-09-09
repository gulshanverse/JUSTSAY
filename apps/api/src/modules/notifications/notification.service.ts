import * as crypto from 'crypto';
import { FcmProvider } from './fcm-production.provider';

export type NotificationEventType = 'new_message' | 'message_reply' | 'message_reaction' | 'moderation_update';

export interface NotificationItem {
  id: string;
  recipientHandle: string;
  type: NotificationEventType;
  title: string;
  body: string;
  timestamp: number;
  read: boolean;
  metadata?: Record<string, any>;
}

export interface NotificationPreferences {
  handle: string;
  newMessages: boolean;
  replies: boolean;
  reactions: boolean;
  moderationNotices: boolean;
}

export interface PushNotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface PushNotificationProvider {
  sendPushNotification(handle: string, title: string, body: string, data?: Record<string, string>): Promise<PushNotificationResult>;
}

export class DevelopmentPushProvider implements PushNotificationProvider {
  public sentPushes: Array<{ handle: string; title: string; body: string }> = [];

  public async sendPushNotification(handle: string, title: string, body: string): Promise<PushNotificationResult> {
    this.sentPushes.push({ handle, title, body });
    return { success: true, messageId: `dev_push_${Date.now()}` };
  }
}

export class FcmPushProvider implements PushNotificationProvider {
  private isConfigured: boolean;

  constructor(isConfigured: boolean = false) {
    this.isConfigured = isConfigured;
  }

  public async sendPushNotification(handle: string, title: string, body: string): Promise<PushNotificationResult> {
    if (!this.isConfigured) {
      // FCM credentials not active in development environment -> fallback cleanly
      return { success: false, error: 'FCM_NOT_CONFIGURED' };
    }
    return { success: true, messageId: `fcm_${Date.now()}` };
  }
}

export class NotificationService {
  private notificationsStore = new Map<string, NotificationItem[]>(); // handle -> list
  private preferencesStore = new Map<string, NotificationPreferences>(); // handle -> prefs
  private userTokens = new Map<string, { userId: string; deviceToken: string; platform: 'android' | 'ios' | 'web'; updatedAt: number }>(); // deviceToken -> record
  private pushProvider: PushNotificationProvider;
  private fcmProvider?: FcmProvider;

  constructor(pushProvider?: PushNotificationProvider, fcmProvider?: FcmProvider) {
    this.pushProvider = pushProvider || new DevelopmentPushProvider();
    this.fcmProvider = fcmProvider;
  }

  public registerPushToken(userId: string, deviceToken: string, platform: 'android' | 'ios' | 'web' = 'android') {
    if (!deviceToken || deviceToken.trim().length === 0) {
      throw new Error('INVALID_TOKEN');
    }
    const token = deviceToken.trim();
    this.userTokens.set(token, {
      userId,
      deviceToken: token,
      platform,
      updatedAt: Date.now()
    });
    if (this.fcmProvider) {
      this.fcmProvider.registerDeviceToken(userId, token, platform);
    }
  }

  public revokePushToken(deviceToken: string) {
    if (!deviceToken) return;
    const token = deviceToken.trim();
    this.userTokens.delete(token);
    if (this.fcmProvider) {
      this.fcmProvider.revokeDeviceToken(token);
    }
  }

  public revokeAllUserTokens(userId: string) {
    for (const [token, record] of Array.from(this.userTokens.entries())) {
      if (record.userId === userId) {
        this.userTokens.delete(token);
        if (this.fcmProvider) {
          this.fcmProvider.revokeDeviceToken(token);
        }
      }
    }
  }

  public getUserTokens(userIdOrHandle: string) {
    if (!userIdOrHandle) return [];
    const target = userIdOrHandle.toLowerCase();
    return Array.from(this.userTokens.values()).filter(
      t => t.userId.toLowerCase() === target || t.userId === userIdOrHandle
    );
  }

  public getPreferences(handle: string): NotificationPreferences {
    const existing = this.preferencesStore.get(handle.toLowerCase());
    if (existing) return existing;

    const defaultPrefs: NotificationPreferences = {
      handle: handle.toLowerCase(),
      newMessages: true,
      replies: true,
      reactions: true,
      moderationNotices: true
    };
    this.preferencesStore.set(handle.toLowerCase(), defaultPrefs);
    return defaultPrefs;
  }

  public updatePreferences(handle: string, updates: Partial<NotificationPreferences>): NotificationPreferences {
    const current = this.getPreferences(handle);
    const updated = { ...current, ...updates };
    this.preferencesStore.set(handle.toLowerCase(), updated);
    return updated;
  }

  public async notifyUser(
    recipientHandle: string,
    type: NotificationEventType,
    customTitle?: string,
    customBody?: string,
    metadata?: Record<string, any>
  ): Promise<NotificationItem | null> {
    const handle = recipientHandle.toLowerCase();
    const prefs = this.getPreferences(handle);

    // Check user preferences
    if (type === 'new_message' && !prefs.newMessages) return null;
    if (type === 'message_reply' && !prefs.replies) return null;
    if (type === 'message_reaction' && !prefs.reactions) return null;
    if (type === 'moderation_update' && !prefs.moderationNotices) return null;

    // Secure default titles/bodies (NON-SENSITIVE PREVIEWS)
    let title = customTitle || 'JUSTSAY Notification';
    let body = customBody || 'You received a new update on JUSTSAY.';

    if (type === 'new_message') {
      title = 'New Anonymous Confession 🤫';
      body = 'You received a new JUSTSAY message.'; // Privacy-first preview!
    } else if (type === 'message_reply') {
      title = 'New Reply to Confession 💬';
      body = 'Someone replied to your JUSTSAY story.';
    } else if (type === 'message_reaction') {
      title = 'New Reaction Received ❤️';
      body = 'Someone reacted to your confession.';
    } else if (type === 'moderation_update') {
      title = 'Safety Status Update 🛡️';
      body = 'An update regarding your reported content is available.';
    }

    const notificationId = `notif_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const item: NotificationItem = {
      id: notificationId,
      recipientHandle: handle,
      type,
      title,
      body,
      timestamp: Date.now(),
      read: false,
      metadata
    };

    const userNotifs = this.notificationsStore.get(handle) || [];
    userNotifs.unshift(item);
    this.notificationsStore.set(handle, userNotifs);

    // Trigger push notification provider
    await this.pushProvider.sendPushNotification(handle, title, body, { type });

    return item;
  }

  public getNotifications(handle: string): NotificationItem[] {
    return this.notificationsStore.get(handle.toLowerCase()) || [];
  }

  public markAsRead(handle: string, notificationId: string): boolean {
    const userNotifs = this.notificationsStore.get(handle.toLowerCase());
    if (!userNotifs) return false;

    const notif = userNotifs.find(n => n.id === notificationId);
    if (notif) {
      notif.read = true;
      return true;
    }
    return false;
  }
}
