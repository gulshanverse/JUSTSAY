export enum ModerationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  SOFT_BLOCKED = 'SOFT_BLOCKED',
  REJECTED = 'REJECTED',
  ESCALATED = 'ESCALATED'
}

export enum AdminRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  MODERATOR = 'MODERATOR',
  AUDITOR = 'AUDITOR'
}

export interface MessageDto {
  id: string;
  recipientHandle: string;
  promptQuestion: string;
  messageText: String;
  timestamp: number;
  cardGradientStart: number;
  cardGradientEnd: number;
  textColor: number;
  stickerTag: string;
  senderHint?: string;
  moderationStatus: ModerationStatus;
  sentiment: string;
  isRead: boolean;
  isFavorite: boolean;
  isFlagged: boolean;
  replyText?: string;
}

export interface UserProfileDto {
  id: string;
  handle: string;
  promptQuestion: string;
  activeTheme: string;
  linkClicks: number;
}

export interface AdminAuthSession {
  accessToken: string;
  userEmail: string;
  role: AdminRole;
  expiresAt: number;
}
