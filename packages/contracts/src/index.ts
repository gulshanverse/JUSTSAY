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

// --- CARD STUDIO CONTRACTS ---
export interface CreateCardProjectRequest {
  title: string;
  canvasRatio: 'STORY_9_16' | 'SQUARE_1_1' | 'PORTRAIT_4_5';
  background: {
    type: 'SOLID' | 'GRADIENT' | 'PRESET';
    colorHex: string;
    gradientStartHex?: string;
    gradientEndHex?: string;
    gradientAngleDegrees?: number;
    presetName?: string;
  };
  elements: any[];
  templateId?: string;
  sourceMessageId?: string;
  includeBranding?: boolean;
}

export interface UpdateCardProjectRequest {
  title?: string;
  canvasRatio?: 'STORY_9_16' | 'SQUARE_1_1' | 'PORTRAIT_4_5';
  background?: any;
  elements?: any[];
  includeBranding?: boolean;
}

export interface CardProjectResponse {
  success: boolean;
  project?: any;
  error?: string;
}

export interface ListCardProjectsResponse {
  projects: any[];
}

export interface ListCardTemplatesResponse {
  templates: any[];
}

export interface ListStickersResponse {
  stickers: any[];
}

export interface CreateCardFromMessageRequest {
  messageId: string;
  templateId?: string;
}

export interface UploadMediaRequest {
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  width?: number;
  height?: number;
  base64Content?: string;
}

export interface UploadMediaResponse {
  success: boolean;
  asset?: any;
  error?: string;
}

// --- PHASE 6 CONTRACTS ---
export interface AdminModerationActionRequest {
  adminToken: string;
  reason?: string;
}

export interface ListFeatureFlagsResponse {
  flags: any[];
}

export interface UpdateFeatureFlagRequest {
  adminToken: string;
  enabled?: boolean;
  rolloutPercentage?: number;
}

export interface EvaluateFeatureFlagRequest {
  flagKey: string;
  userHandle?: string;
}

export interface EvaluateFeatureFlagResponse {
  flagKey: string;
  enabled: boolean;
}

export interface TrackAnalyticsEventRequest {
  eventName: string;
  properties?: Record<string, any>;
}

export interface GetFunnelAnalyticsResponse {
  funnelSteps: Array<{
    step: string;
    count: number;
    conversionRatePercentage: number;
  }>;
}

export interface AdminUserActionRequest {
  adminToken: string;
  targetHandle: string;
  reason?: string;
}

export interface RequestDataExportResponse {
  success: boolean;
  exportPackage?: any;
  error?: string;
}
