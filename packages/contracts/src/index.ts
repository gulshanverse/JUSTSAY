import { MessageDto, UserProfileDto, ModerationStatus } from '@justsay/shared-types';

export interface SendMessageRequest {
  recipientHandle: string;
  promptQuestion: string;
  messageText: string;
  gradientStart?: number;
  gradientEnd?: number;
  textColor?: number;
  stickerTag?: string;
}

export interface SendMessageResponse {
  success: boolean;
  messageId: string;
  moderationStatus: ModerationStatus;
}

export interface GetInboxResponse {
  messages: MessageDto[];
  totalCount: number;
  unreadCount: number;
}

export interface AdminLoginRequest {
  authToken: string;
}

export interface AdminLoginResponse {
  authenticated: boolean;
  role: string;
  token: string;
}
