import {
  MessageDto,
  UserProfileDto,
  UserDto,
  UserPreferencesDto,
  AuthSessionDto,
  HandleCheckResultDto,
  ModerationStatus,
  MessageStatus
} from '@justsay/shared-types';

export interface RegisterRequest {
  email: string;
  password: string;
  handle: string;
  displayName?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  session?: AuthSessionDto;
  error?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface CheckHandleRequest {
  handle: string;
}

export interface CheckHandleResponse {
  handle: string;
  available: boolean;
  reason?: string;
}

export interface UpdateProfileRequest {
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  promptQuestion?: string;
  activeTheme?: string;
  anonymousMessagesEnabled?: boolean;
  allowImageMessages?: boolean;
  allowReplies?: boolean;
  allowReactions?: boolean;
  isPublicProfile?: boolean;
}

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
  messageStatus: MessageStatus;
  error?: string;
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

export interface GetInboxRequest {
  filter?: 'all' | 'unread' | 'favorites' | 'flagged';
}

export interface ReplyMessageRequest {
  replyText: string;
}

export interface ReactMessageRequest {
  reactionEmoji: string;
}

export interface ReportMessageRequest {
  reason: 'Harassment' | 'Threat' | 'Hate' | 'Sexual content' | 'Spam' | 'Self-harm concern' | 'Scam' | 'Other';
  details?: string;
}

export interface BlockUserRequest {
  messageId: string;
}

export interface GenericApiResponse {
  success: boolean;
  error?: string;
}
