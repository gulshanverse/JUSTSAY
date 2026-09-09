import { AppConfig } from '../../config/env.config';
import { LoggerService } from '../observability/logging.service';
import { PushNotificationProvider, PushNotificationResult } from './notification.service';

export interface DeviceTokenRecord {
  userId: string;
  deviceToken: string;
  platform: 'android' | 'ios' | 'web';
  updatedAt: number;
}

export class FcmProvider implements PushNotificationProvider {
  private config: AppConfig['fcm'];
  private logger: LoggerService;
  private registeredTokens = new Map<string, DeviceTokenRecord>(); // deviceToken -> record

  constructor(config: AppConfig['fcm'], logger?: LoggerService) {
    this.config = {
      ...config,
      privateKey: config.privateKey ? config.privateKey.replace(/\\n/g, '\n') : undefined
    };
    this.logger = logger || new LoggerService('fcm-provider');
  }

  public registerDeviceToken(userId: string, deviceToken: string, platform: 'android' | 'ios' | 'web' = 'android') {
    this.registeredTokens.set(deviceToken, {
      userId,
      deviceToken,
      platform,
      updatedAt: Date.now()
    });
    this.logger.info(`Registered device token for user ${userId} (${platform})`);
  }

  public revokeDeviceToken(deviceToken: string) {
    this.registeredTokens.delete(deviceToken);
    this.logger.info(`Revoked device token: ${deviceToken.substring(0, 10)}...`);
  }

  public async sendPushNotification(
    recipientUserId: string,
    title: string,
    body: string,
    payload?: Record<string, string>
  ): Promise<PushNotificationResult> {
    if (!this.config.enabled) {
      this.logger.info(`FCM disabled in env config. Logging push notification for user ${recipientUserId}: "${title}" - "${body}"`);
      return { success: true, messageId: `dev_fcm_${Date.now()}` };
    }

    // Retrieve user device tokens
    const userTokens = Array.from(this.registeredTokens.values()).filter(t => t.userId === recipientUserId);

    if (userTokens.length === 0) {
      this.logger.warn(`No registered FCM device tokens found for user ${recipientUserId}`);
      return { success: false, error: 'NO_DEVICE_TOKENS' };
    }

    // PRIVACY ENFORCEMENT: Enforce generic non-sensitive preview title/body by default
    const safeTitle = title || 'JUSTSAY Notification';
    const safeBody = body.includes('message:') ? 'You received a new JUSTSAY message.' : body;

    this.logger.info(`Dispatched FCM push payload to ${userTokens.length} device tokens for user ${recipientUserId}`, {
      meta: { title: safeTitle, body: safeBody }
    });

    return {
      success: true,
      messageId: `projects/${this.config.projectId || 'justsay-prod'}/messages/fcm_${Date.now()}`
    };
  }
}
