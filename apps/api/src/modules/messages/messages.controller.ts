import { SendMessageRequest, SendMessageResponse, GetInboxResponse, GenericApiResponse } from '@justsay/contracts';
import { ModerationStatus, MessageStatus, MessageDto } from '@justsay/shared-types';
import { ServerModerationService } from '../moderation/moderation.service';
import { ValidationRules } from '@justsay/validation';
import { RateLimiterService } from '../ratelimit/ratelimit.service';
import { AuthService } from '../auth/auth.service';
import * as crypto from 'crypto';

interface StoredMessage {
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
  reactions: Record<string, number>;
  // Security telemetry (INTERNAL ONLY - NEVER RETURNED TO RECIPIENT)
  _internalSenderIp?: string;
  _internalDeviceFingerprint?: string;
}

export class MessagesController {
  private moderationService: ServerModerationService;
  private rateLimiter: RateLimiterService;
  private authService: AuthService;
  private messagesStore = new Map<string, StoredMessage[]>();
  private blocksStore = new Set<string>(); // key: recipientHandle + ":" + anonymousAbuseKey

  constructor(moderationService: ServerModerationService, rateLimiter: RateLimiterService, authService: AuthService) {
    this.moderationService = moderationService;
    this.rateLimiter = rateLimiter;
    this.authService = authService;
  }

  // Internal Privacy Abstraction: derive non-reversible AnonymousAbuseKey from sender telemetry
  private computeAnonymousAbuseKey(clientIp: string): string {
    return crypto.createHash('sha256').update(`${clientIp}_salt_abuse_key_v2_justsay`).digest('hex');
  }

  public getRawMessage(handle: string, messageId: string): StoredMessage | undefined {
    const msgs = this.messagesStore.get(handle.toLowerCase()) || [];
    return msgs.find(m => m.id === messageId);
  }

  public async postMessage(req: SendMessageRequest, clientIp: string): Promise<SendMessageResponse> {
    // 1. Rate Limiting Check
    const rateCheck = this.rateLimiter.isAllowed(`msg_post_${clientIp}`);
    if (!rateCheck.allowed) {
      return {
        success: false,
        messageId: '',
        moderationStatus: ModerationStatus.REJECTED,
        messageStatus: MessageStatus.REJECTED,
        error: `Rate limit exceeded. Try again in ${rateCheck.retryAfterSeconds} seconds.`
      };
    }

    // 2. Validate Recipient Handle
    const recipientUser = this.authService.getUserByHandle(req.recipientHandle);
    if (!recipientUser) {
      return {
        success: false,
        messageId: '',
        moderationStatus: ModerationStatus.REJECTED,
        messageStatus: MessageStatus.REJECTED,
        error: 'Recipient user does not exist or account is inactive'
      };
    }

    if (!recipientUser.anonymousMessagesEnabled) {
      return {
        success: false,
        messageId: '',
        moderationStatus: ModerationStatus.REJECTED,
        messageStatus: MessageStatus.REJECTED,
        error: 'Recipient has disabled anonymous messages'
      };
    }

    // Check if client is blocked by recipient using AnonymousAbuseKey
    const abuseKey = this.computeAnonymousAbuseKey(clientIp);
    const blockKey = `${recipientUser.handle.toLowerCase()}:${abuseKey}`;
    if (this.blocksStore.has(blockKey)) {
      return {
        success: false,
        messageId: '',
        moderationStatus: ModerationStatus.REJECTED,
        messageStatus: MessageStatus.REJECTED,
        error: 'Unable to send message to this user'
      };
    }

    // 3. Validation Rules
    const val = ValidationRules.validateMessageText(req.messageText);
    if (!val.isValid) {
      return {
        success: false,
        messageId: '',
        moderationStatus: ModerationStatus.REJECTED,
        messageStatus: MessageStatus.REJECTED,
        error: val.error
      };
    }

    // 4. Moderation & Abuse Checks
    const modResult = await this.moderationService.evaluateMessage(req.messageText);
    const msgId = `msg_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    let msgStatus: MessageStatus = MessageStatus.APPROVED;
    if (modResult.status === ModerationStatus.SOFT_BLOCKED) {
      msgStatus = MessageStatus.SOFT_BLOCKED;
    } else if (modResult.status === ModerationStatus.REJECTED) {
      msgStatus = MessageStatus.REJECTED;
    } else if (modResult.status === ModerationStatus.PENDING) {
      msgStatus = MessageStatus.PENDING_MODERATION;
    }

    // 5. Build Stored Message with strict Internal Security Telemetry
    const storedMsg: StoredMessage = {
      id: msgId,
      recipientHandle: recipientUser.handle,
      promptQuestion: req.promptQuestion || recipientUser.activePrompt,
      messageText: req.messageText,
      timestamp: Date.now(),
      cardGradientStart: req.gradientStart ?? 0xFFFF2A85,
      cardGradientEnd: req.gradientEnd ?? 0xFFFF7B00,
      textColor: req.textColor ?? 0xFFFFFFFF,
      stickerTag: req.stickerTag || '✨ Confession',
      senderHint: 'Sent anonymously 🔒',
      moderationStatus: modResult.status,
      messageStatus: msgStatus,
      sentiment: modResult.status === ModerationStatus.APPROVED ? 'Positive' : 'Flagged',
      isRead: false,
      isFavorite: false,
      isFlagged: modResult.status !== ModerationStatus.APPROVED,
      reactions: {},
      _internalSenderIp: clientIp,
      _internalDeviceFingerprint: 'Web-Client'
    };

    const userMsgs = this.messagesStore.get(recipientUser.handle) || [];
    userMsgs.unshift(storedMsg);
    this.messagesStore.set(recipientUser.handle, userMsgs);

    return {
      success: modResult.status !== ModerationStatus.REJECTED,
      messageId: msgId,
      moderationStatus: modResult.status,
      messageStatus: msgStatus
    };
  }

  public async getInbox(authHeader: string, filter?: string): Promise<GetInboxResponse> {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { messages: [], totalCount: 0, unreadCount: 0 };
    }
    const token = authHeader.replace('Bearer ', '').trim();
    const session = await this.authService.getSession(token);

    if (!session) {
      return { messages: [], totalCount: 0, unreadCount: 0 };
    }

    let rawMsgs = this.messagesStore.get(session.user.handle) || [];

    if (filter === 'unread') {
      rawMsgs = rawMsgs.filter(m => !m.isRead);
    } else if (filter === 'favorites') {
      rawMsgs = rawMsgs.filter(m => m.isFavorite);
    } else if (filter === 'flagged') {
      rawMsgs = rawMsgs.filter(m => m.isFlagged);
    }

    // PRIVACY SANITIZATION: Strip out any internal telemetry before returning DTO
    const cleanDtos: MessageDto[] = rawMsgs.map(m => ({
      id: m.id,
      recipientHandle: m.recipientHandle,
      promptQuestion: m.promptQuestion,
      messageText: m.messageText,
      timestamp: m.timestamp,
      cardGradientStart: m.cardGradientStart,
      cardGradientEnd: m.cardGradientEnd,
      textColor: m.textColor,
      stickerTag: m.stickerTag,
      senderHint: m.senderHint,
      moderationStatus: m.moderationStatus,
      messageStatus: m.messageStatus,
      sentiment: m.sentiment,
      isRead: m.isRead,
      isFavorite: m.isFavorite,
      isFlagged: m.isFlagged,
      replyText: m.replyText
    }));

    const allUserMsgs = this.messagesStore.get(session.user.handle) || [];
    const unread = allUserMsgs.filter(m => !m.isRead).length;

    return {
      messages: cleanDtos,
      totalCount: cleanDtos.length,
      unreadCount: unread
    };
  }

  public async replyToMessage(authHeader: string, messageId: string, replyText: string): Promise<GenericApiResponse> {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { success: false, error: 'Unauthorized' };
    }
    const token = authHeader.replace('Bearer ', '').trim();
    const session = await this.authService.getSession(token);

    if (!session) {
      return { success: false, error: 'Session invalid or expired' };
    }

    const userMsgs = this.messagesStore.get(session.user.handle) || [];
    const msg = userMsgs.find(m => m.id === messageId);

    if (!msg) {
      return { success: false, error: 'Message not found or unauthorized' };
    }

    if (!replyText || replyText.trim().length === 0) {
      return { success: false, error: 'Reply text cannot be empty' };
    }

    msg.replyText = replyText.trim();
    return { success: true };
  }

  public async reactToMessage(authHeader: string, messageId: string, emoji: string): Promise<GenericApiResponse> {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { success: false, error: 'Unauthorized' };
    }
    const token = authHeader.replace('Bearer ', '').trim();
    const session = await this.authService.getSession(token);

    if (!session) {
      return { success: false, error: 'Session invalid or expired' };
    }

    const validEmojis = new Set(['❤️', '😂', '😭', '👀', '🔥', '💀']);
    if (!validEmojis.has(emoji)) {
      return { success: false, error: 'Invalid reaction emoji' };
    }

    const userMsgs = this.messagesStore.get(session.user.handle) || [];
    const msg = userMsgs.find(m => m.id === messageId);

    if (!msg) {
      return { success: false, error: 'Message not found or unauthorized' };
    }

    msg.reactions[emoji] = (msg.reactions[emoji] || 0) + 1;
    return { success: true };
  }

  public async toggleFavorite(authHeader: string, messageId: string): Promise<GenericApiResponse> {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { success: false, error: 'Unauthorized' };
    }
    const token = authHeader.replace('Bearer ', '').trim();
    const session = await this.authService.getSession(token);

    if (!session) {
      return { success: false, error: 'Session invalid or expired' };
    }

    const userMsgs = this.messagesStore.get(session.user.handle) || [];
    const msg = userMsgs.find(m => m.id === messageId);

    if (!msg) {
      return { success: false, error: 'Message not found or unauthorized' };
    }

    msg.isFavorite = !msg.isFavorite;
    return { success: true };
  }

  public async markAsRead(authHeader: string, messageId: string): Promise<GenericApiResponse> {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { success: false, error: 'Unauthorized' };
    }
    const token = authHeader.replace('Bearer ', '').trim();
    const session = await this.authService.getSession(token);

    if (!session) {
      return { success: false, error: 'Session invalid or expired' };
    }

    const userMsgs = this.messagesStore.get(session.user.handle) || [];
    const msg = userMsgs.find(m => m.id === messageId);

    if (!msg) {
      return { success: false, error: 'Message not found or unauthorized' };
    }

    msg.isRead = true;
    msg.messageStatus = MessageStatus.READ;
    return { success: true };
  }

  public async reportMessage(authHeader: string, messageId: string, reason: string): Promise<GenericApiResponse> {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { success: false, error: 'Unauthorized' };
    }
    const token = authHeader.replace('Bearer ', '').trim();
    const session = await this.authService.getSession(token);

    if (!session) {
      return { success: false, error: 'Session invalid or expired' };
    }

    const userMsgs = this.messagesStore.get(session.user.handle) || [];
    const msg = userMsgs.find(m => m.id === messageId);

    if (!msg) {
      return { success: false, error: 'Message not found or unauthorized' };
    }

    msg.isFlagged = true;
    msg.moderationStatus = ModerationStatus.ESCALATED;
    msg.messageStatus = MessageStatus.ESCALATED;

    return { success: true };
  }

  public async blockSenderFromMessage(authHeader: string, messageId: string): Promise<GenericApiResponse> {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { success: false, error: 'Unauthorized' };
    }
    const token = authHeader.replace('Bearer ', '').trim();
    const session = await this.authService.getSession(token);

    if (!session) {
      return { success: false, error: 'Session invalid or expired' };
    }

    const userMsgs = this.messagesStore.get(session.user.handle) || [];
    const msg = userMsgs.find(m => m.id === messageId);

    if (!msg) {
      return { success: false, error: 'Message not found or unauthorized' };
    }

    if (msg._internalSenderIp) {
      const abuseKey = this.computeAnonymousAbuseKey(msg._internalSenderIp);
      const blockKey = `${session.user.handle.toLowerCase()}:${abuseKey}`;
      this.blocksStore.add(blockKey);
    }

    return { success: true };
  }

  public async deleteMessage(authHeader: string, messageId: string): Promise<GenericApiResponse> {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { success: false, error: 'Unauthorized' };
    }
    const token = authHeader.replace('Bearer ', '').trim();
    const session = await this.authService.getSession(token);

    if (!session) {
      return { success: false, error: 'Session invalid or expired' };
    }

    let userMsgs = this.messagesStore.get(session.user.handle) || [];
    const initialLen = userMsgs.length;
    userMsgs = userMsgs.filter(m => m.id !== messageId);

    if (userMsgs.length === initialLen) {
      return { success: false, error: 'Message not found or unauthorized' };
    }

    this.messagesStore.set(session.user.handle, userMsgs);
    return { success: true };
  }
}
