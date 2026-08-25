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
  SUPER_ADMIN = 'SUPER_ADMIN',
  MODERATOR = 'MODERATOR',
  AUDITOR = 'AUDITOR'
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
