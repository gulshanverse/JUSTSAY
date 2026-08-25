import { FeatureFlagDto } from '@justsay/shared-types';
import * as crypto from 'crypto';

export class FeatureFlagsService {
  private flagsStore = new Map<string, FeatureFlagDto>();

  constructor() {
    this.seedDefaultFlags();
  }

  private seedDefaultFlags() {
    const defaults: FeatureFlagDto[] = [
      {
        key: 'card_studio_v2',
        enabled: true,
        rolloutPercentage: 100,
        description: 'Enables advanced vector multi-layer canvas controls and story ratio presets.',
        updatedAt: Date.now()
      },
      {
        key: 'image_uploads',
        enabled: true,
        rolloutPercentage: 100,
        description: 'Allows custom image asset uploads with magic byte validation.',
        updatedAt: Date.now()
      },
      {
        key: 'gif_support',
        enabled: false,
        rolloutPercentage: 0,
        description: 'Experimental Giphy animated sticker integration.',
        updatedAt: Date.now()
      },
      {
        key: 'anonymous_replies',
        enabled: true,
        rolloutPercentage: 100,
        description: 'Permits anonymous story card creation from inbox messages.',
        updatedAt: Date.now()
      },
      {
        key: 'ai_moderation_v2',
        enabled: true,
        rolloutPercentage: 100,
        description: 'Multi-layer risk level scoring and automated policy engine.',
        updatedAt: Date.now()
      },
      {
        key: 'story_export_v2',
        enabled: true,
        rolloutPercentage: 100,
        description: 'High-resolution image rendering and native social share intents.',
        updatedAt: Date.now()
      },
      {
        key: 'new_profile_ui',
        enabled: true,
        rolloutPercentage: 50,
        description: 'Curated profile themes and QR share card previews.',
        updatedAt: Date.now()
      }
    ];

    for (const flag of defaults) {
      this.flagsStore.set(flag.key, flag);
    }
  }

  public getAllFlags(): FeatureFlagDto[] {
    return Array.from(this.flagsStore.values());
  }

  public getFlag(key: string): FeatureFlagDto | undefined {
    return this.flagsStore.get(key);
  }

  public updateFlag(key: string, enabled?: boolean, rolloutPercentage?: number): FeatureFlagDto {
    let flag = this.flagsStore.get(key);
    if (!flag) {
      flag = {
        key,
        enabled: enabled ?? false,
        rolloutPercentage: rolloutPercentage ?? 0,
        description: `Custom feature flag: ${key}`,
        updatedAt: Date.now()
      };
    } else {
      if (enabled !== undefined) flag.enabled = enabled;
      if (rolloutPercentage !== undefined) {
        flag.rolloutPercentage = Math.max(0, Math.min(100, rolloutPercentage));
      }
      flag.updatedAt = Date.now();
    }
    this.flagsStore.set(key, flag);
    return flag;
  }

  /**
   * Deterministic Bucketing:
   * Maps userHandle + flagKey to a consistent 0..99 integer bucket.
   * Ensures a user remains consistently in or out of a rollout cohort.
   */
  public isFeatureEnabledForUser(flagKey: string, userHandle?: string): boolean {
    const flag = this.flagsStore.get(flagKey);
    if (!flag || !flag.enabled) return false;
    if (flag.rolloutPercentage >= 100) return true;
    if (flag.rolloutPercentage <= 0) return false;
    if (!userHandle) return false;

    // Hash userHandle + flagKey
    const hash = crypto.createHash('md5').update(`${flagKey}:${userHandle.toLowerCase()}`).digest('hex');
    const numericHash = parseInt(hash.substring(0, 8), 16);
    const userBucket = numericHash % 100;

    return userBucket < flag.rolloutPercentage;
  }
}
