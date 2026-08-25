export enum ModerationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  SOFT_BLOCKED = 'SOFT_BLOCKED',
  REJECTED = 'REJECTED',
  ESCALATED = 'ESCALATED'
}

export enum MessageStatus {
  PENDING_MODERATION = 'PENDING_MODERATION',
  APPROVED = 'APPROVED',
  SOFT_BLOCKED = 'SOFT_BLOCKED',
  REJECTED = 'REJECTED',
  ESCALATED = 'ESCALATED',
  DELIVERED = 'DELIVERED',
  READ = 'READ'
}

export enum AdminRole {
  SUPPORT = 'SUPPORT',
  MODERATOR = 'MODERATOR',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
  AUDITOR = 'AUDITOR'
}

export enum ModerationRiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export type ModerationCategory =
  | 'harassment'
  | 'hate'
  | 'threat'
  | 'sexual'
  | 'spam'
  | 'self_harm'
  | 'scam'
  | 'other';

export interface ModerationResultDto {
  decision: ModerationStatus;
  riskLevel: ModerationRiskLevel;
  categories: ModerationCategory[];
  confidence: number;
  reasons: string[];
  evaluatedAt: number;
}

export interface UserDto {
  id: string;
  email: string;
  handle: string;
  displayName: string;
  bio: string;
  avatarUrl?: string;
  activePrompt: string;
  anonymousMessagesEnabled: boolean;
  allowImageMessages: boolean;
  allowReplies: boolean;
  allowReactions: boolean;
  isPublicProfile: boolean;
  createdAt: number;
}

export interface UserPreferencesDto {
  activeTheme: string;
  pushNotificationsEnabled: boolean;
  emailNotificationsEnabled: boolean;
  safetyStrictness: string;
}

export interface AuthSessionDto {
  accessToken: string;
  refreshToken: string;
  user: UserDto;
  expiresAt: number;
}

export interface HandleCheckResultDto {
  handle: string;
  available: boolean;
  reason?: string;
}

export interface MessageDto {
  id: string;
  recipientHandle: string;
  promptQuestion: string;
  messageText: string;
  timestamp: number;
  cardGradientStart: number;
  cardGradientEnd: number;
  textColor: number;
  stickerTag: string;
  senderHint?: string;
  moderationStatus: ModerationStatus;
  messageStatus: MessageStatus;
  sentiment: string;
  isRead: boolean;
  isFavorite: boolean;
  isFlagged: boolean;
  replyText?: string;
}

export interface UserProfileDto {
  id: string;
  handle: string;
  displayName: string;
  bio: string;
  avatarUrl?: string;
  promptQuestion: string;
  activeTheme: string;
  anonymousMessagesEnabled: boolean;
  allowImageMessages: boolean;
  allowReplies: boolean;
  allowReactions: boolean;
  isPublicProfile: boolean;
}

export interface AdminAuthSession {
  accessToken: string;
  userEmail: string;
  role: AdminRole;
  expiresAt: number;
}

export interface AnalyticsEventDto {
  eventName: string;
  properties?: Record<string, any>;
  timestamp: number;
}

// --- CARD STUDIO DOMAIN MODELS ---
export type CardCanvasRatio = 'STORY_9_16' | 'SQUARE_1_1' | 'PORTRAIT_4_5';

export type CardBackgroundType = 'SOLID' | 'GRADIENT' | 'PRESET';

export interface CardBackground {
  type: CardBackgroundType;
  colorHex: string;
  gradientStartHex?: string;
  gradientEndHex?: string;
  gradientAngleDegrees?: number;
  presetName?: string;
}

export type ElementType = 'TEXT' | 'IMAGE' | 'STICKER' | 'SHAPE' | 'EMOJI';

export interface CardElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  opacity: number;
  content: string;
  fontSize?: number;
  fontWeight?: string;
  fontFamily?: string;
  textColorHex?: string;
  alignment?: 'left' | 'center' | 'right';
  effect?: 'none' | 'shadow' | 'outline' | 'glow' | 'background_label';
}

export interface CardProjectDto {
  id: string;
  ownerHandle: string;
  title: string;
  canvasRatio: CardCanvasRatio;
  background: CardBackground;
  elements: CardElement[];
  templateId?: string;
  sourceMessageId?: string;
  includeBranding: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface CardTemplateDto {
  id: string;
  name: string;
  category: string;
  presetName: string;
  background: CardBackground;
  defaultElements: CardElement[];
}

export interface StickerDto {
  id: string;
  name: string;
  category: string;
  emojiOrAsset: string;
  keywords: string[];
}

export interface MediaAssetDto {
  id: string;
  ownerHandle: string;
  mimeType: string;
  fileSizeBytes: number;
  width: number;
  height: number;
  assetUrl: string;
  createdAt: number;
}

export interface FeatureFlagDto {
  key: string;
  enabled: boolean;
  rolloutPercentage: number; // 0..100
  description: string;
  updatedAt: number;
}

export interface AdminAuditLogEntry {
  id: string;
  adminId: string;
  role: AdminRole;
  action: string;
  targetType: 'user' | 'message' | 'moderation' | 'feature_flag' | 'system';
  targetId: string;
  details?: Record<string, any>;
  timestamp: number;
}

export interface ModerationQueueItemDto {
  id: string;
  messageId: string;
  recipientHandle: string;
  messageText: string;
  promptQuestion: string;
  moderationResult: ModerationResultDto;
  status: ModerationStatus;
  createdAt: number;
}

export interface SystemHealthStatus {
  status: 'HEALTHY' | 'DEGRADED' | 'DOWN';
  timestamp: number;
  services: {
    api: { status: 'HEALTHY' | 'DEGRADED'; version: string };
    database: { status: string; type: string };
    cache: { status: string; type: string };
    storage: { status: string; type: string };
    queue: { status: string; type: string };
  };
}

export interface AccountExportPackageDto {
  user: UserDto;
  preferences: UserPreferencesDto;
  receivedMessagesCount: number;
  cardProjectsCount: number;
  mediaAssetsCount: number;
  exportGeneratedAt: number;
  dataUrl: string;
}
