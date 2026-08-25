import {
  CardProjectDto,
  CardTemplateDto,
  StickerDto,
  CardElement,
  CardBackground
} from '@justsay/shared-types';
import {
  CreateCardProjectRequest,
  UpdateCardProjectRequest,
  CardProjectResponse,
  ListCardProjectsResponse,
  ListCardTemplatesResponse,
  ListStickersResponse,
  CreateCardFromMessageRequest,
  GenericApiResponse
} from '@justsay/contracts';
import { AuthService } from '../auth/auth.service';
import { MessagesController } from '../messages/messages.controller';
import * as crypto from 'crypto';

export class CardsController {
  private authService: AuthService;
  private messagesController: MessagesController;
  private cardProjectsStore = new Map<string, CardProjectDto>(); // id -> project
  private templatesStore: CardTemplateDto[] = [];
  private stickersStore: StickerDto[] = [];

  constructor(authService: AuthService, messagesController: MessagesController) {
    this.authService = authService;
    this.messagesController = messagesController;
    this.initializeTemplates();
    this.initializeStickers();
  }

  private initializeTemplates() {
    this.templatesStore = [
      {
        id: 'tmpl_confession_01',
        name: 'Midnight Confession',
        category: 'Confession',
        presetName: 'Midnight',
        background: {
          type: 'PRESET',
          colorHex: '#0B0D17',
          gradientStartHex: '#1A1C2E',
          gradientEndHex: '#0B0D17',
          presetName: 'Midnight'
        },
        defaultElements: [
          {
            id: 'elem_text_prompt',
            type: 'TEXT',
            x: 50,
            y: 30,
            width: 300,
            height: 60,
            rotation: 0,
            zIndex: 1,
            opacity: 1,
            content: 'send me honest confessions 🤫',
            fontSize: 16,
            fontWeight: 'bold',
            textColorHex: '#FF7B00',
            alignment: 'center'
          },
          {
            id: 'elem_text_body',
            type: 'TEXT',
            x: 50,
            y: 50,
            width: 320,
            height: 120,
            rotation: 0,
            zIndex: 2,
            opacity: 1,
            content: 'Your text here...',
            fontSize: 22,
            fontWeight: 'bold',
            textColorHex: '#FFFFFF',
            alignment: 'center'
          }
        ]
      },
      {
        id: 'tmpl_crush_01',
        name: 'Sunset Crush',
        category: 'Crush',
        presetName: 'Sunset',
        background: {
          type: 'PRESET',
          colorHex: '#FF2A85',
          gradientStartHex: '#FF2A85',
          gradientEndHex: '#FF7B00',
          presetName: 'Sunset'
        },
        defaultElements: [
          {
            id: 'elem_text_body',
            type: 'TEXT',
            x: 50,
            y: 50,
            width: 300,
            height: 100,
            rotation: 0,
            zIndex: 1,
            opacity: 1,
            content: 'Secret Crush Notes 💕',
            fontSize: 24,
            fontWeight: 'bold',
            textColorHex: '#FFFFFF',
            alignment: 'center'
          }
        ]
      },
      {
        id: 'tmpl_bubblegum_01',
        name: 'Bubblegum Dream',
        category: 'Funny',
        presetName: 'Bubblegum',
        background: {
          type: 'PRESET',
          colorHex: '#F72585',
          gradientStartHex: '#F72585',
          gradientEndHex: '#7209B7',
          presetName: 'Bubblegum'
        },
        defaultElements: []
      },
      {
        id: 'tmpl_y2k_01',
        name: 'Y2K Cyber',
        category: 'Mood',
        presetName: 'Y2K',
        background: {
          type: 'PRESET',
          colorHex: '#00F5D4',
          gradientStartHex: '#00F5D4',
          gradientEndHex: '#7B2CBF',
          presetName: 'Y2K'
        },
        defaultElements: []
      }
    ];
  }

  private initializeStickers() {
    this.stickersStore = [
      { id: 'stk_01', name: 'Eyes', category: 'Reactions', emojiOrAsset: '👀', keywords: ['eyes', 'look', 'drama'] },
      { id: 'stk_02', name: 'Loud Crying', category: 'Reactions', emojiOrAsset: '😭', keywords: ['cry', 'sad', 'lol'] },
      { id: 'stk_03', name: 'Skull', category: 'Funny', emojiOrAsset: '💀', keywords: ['dead', 'funny', 'laugh'] },
      { id: 'stk_04', name: 'Red Heart', category: 'Love', emojiOrAsset: '❤️', keywords: ['heart', 'love', 'crush'] },
      { id: 'stk_05', name: 'Fire', category: 'Mood', emojiOrAsset: '🔥', keywords: ['hot', 'fire', 'lit'] },
      { id: 'stk_06', name: 'Melting', category: 'Gen-Z', emojiOrAsset: '🫠', keywords: ['melt', 'awkward'] },
      { id: 'stk_07', name: 'Sparkles', category: 'Decorative', emojiOrAsset: '✨', keywords: ['sparkles', 'magic'] },
      { id: 'stk_08', name: 'Shushing', category: 'Crush', emojiOrAsset: '🤫', keywords: ['secret', 'confession'] }
    ];
  }

  public async getTemplates(): Promise<ListCardTemplatesResponse> {
    return { templates: this.templatesStore };
  }

  public async getStickers(): Promise<ListStickersResponse> {
    return { stickers: this.stickersStore };
  }

  public async createProject(authHeader: string, req: CreateCardProjectRequest): Promise<CardProjectResponse> {
    const session = await this.verifyAuth(authHeader);
    if (!session) return { success: false, error: 'Unauthorized' };

    const projectId = `card_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const now = Date.now();

    const project: CardProjectDto = {
      id: projectId,
      ownerHandle: session.user.handle,
      title: req.title || 'Untitled Card',
      canvasRatio: req.canvasRatio || 'STORY_9_16',
      background: req.background,
      elements: req.elements || [],
      templateId: req.templateId,
      sourceMessageId: req.sourceMessageId,
      includeBranding: req.includeBranding ?? true,
      createdAt: now,
      updatedAt: now
    };

    this.cardProjectsStore.set(projectId, project);
    return { success: true, project };
  }

  public async updateProject(authHeader: string, projectId: string, updates: UpdateCardProjectRequest): Promise<CardProjectResponse> {
    const session = await this.verifyAuth(authHeader);
    if (!session) return { success: false, error: 'Unauthorized' };

    const project = this.cardProjectsStore.get(projectId);
    if (!project) return { success: false, error: 'Card project not found' };

    // STRICT OWNERSHIP ENFORCEMENT
    if (project.ownerHandle.toLowerCase() !== session.user.handle.toLowerCase()) {
      return { success: false, error: 'Forbidden: You do not own this card project' };
    }

    if (updates.title !== undefined) project.title = updates.title;
    if (updates.canvasRatio !== undefined) project.canvasRatio = updates.canvasRatio;
    if (updates.background !== undefined) project.background = updates.background;
    if (updates.elements !== undefined) project.elements = updates.elements;
    if (updates.includeBranding !== undefined) project.includeBranding = updates.includeBranding;
    project.updatedAt = Date.now();

    return { success: true, project };
  }

  public async getProject(authHeader: string, projectId: string): Promise<CardProjectResponse> {
    const session = await this.verifyAuth(authHeader);
    if (!session) return { success: false, error: 'Unauthorized' };

    const project = this.cardProjectsStore.get(projectId);
    if (!project) return { success: false, error: 'Card project not found' };

    // STRICT OWNERSHIP CHECK
    if (project.ownerHandle.toLowerCase() !== session.user.handle.toLowerCase()) {
      return { success: false, error: 'Forbidden: Private project' };
    }

    return { success: true, project };
  }

  public async listProjects(authHeader: string): Promise<ListCardProjectsResponse> {
    const session = await this.verifyAuth(authHeader);
    if (!session) return { projects: [] };

    const userProjects = Array.from(this.cardProjectsStore.values()).filter(
      p => p.ownerHandle.toLowerCase() === session.user.handle.toLowerCase()
    );

    return { projects: userProjects };
  }

  public async deleteProject(authHeader: string, projectId: string): Promise<GenericApiResponse> {
    const session = await this.verifyAuth(authHeader);
    if (!session) return { success: false, error: 'Unauthorized' };

    const project = this.cardProjectsStore.get(projectId);
    if (!project) return { success: false, error: 'Project not found' };

    if (project.ownerHandle.toLowerCase() !== session.user.handle.toLowerCase()) {
      return { success: false, error: 'Forbidden: You do not own this card project' };
    }

    this.cardProjectsStore.delete(projectId);
    return { success: true };
  }

  public async createCardFromMessage(authHeader: string, req: CreateCardFromMessageRequest): Promise<CardProjectResponse> {
    const session = await this.verifyAuth(authHeader);
    if (!session) return { success: false, error: 'Unauthorized' };

    const msg = this.messagesController.getRawMessage(session.user.handle, req.messageId);
    if (!msg) return { success: false, error: 'Message not found or recipient mismatch' };

    const template = this.templatesStore.find(t => t.id === req.templateId) || this.templatesStore[0];

    // Pre-populate card with confession text without inserting sender telemetry!
    const elements: CardElement[] = [
      {
        id: 'elem_prompt',
        type: 'TEXT',
        x: 50,
        y: 25,
        width: 320,
        height: 50,
        rotation: 0,
        zIndex: 1,
        opacity: 1,
        content: msg.promptQuestion,
        fontSize: 16,
        fontWeight: 'bold',
        textColorHex: '#FF7B00',
        alignment: 'center'
      },
      {
        id: 'elem_msg_body',
        type: 'TEXT',
        x: 50,
        y: 50,
        width: 340,
        height: 140,
        rotation: 0,
        zIndex: 2,
        opacity: 1,
        content: msg.messageText,
        fontSize: 22,
        fontWeight: 'bold',
        textColorHex: '#FFFFFF',
        alignment: 'center'
      },
      {
        id: 'elem_sticker_tag',
        type: 'STICKER',
        x: 50,
        y: 80,
        width: 100,
        height: 40,
        rotation: 0,
        zIndex: 3,
        opacity: 1,
        content: msg.stickerTag || '🤫 Confession'
      }
    ];

    const projectId = `card_msg_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const now = Date.now();

    const project: CardProjectDto = {
      id: projectId,
      ownerHandle: session.user.handle,
      title: `Card from Confession`,
      canvasRatio: 'STORY_9_16',
      background: template.background,
      elements,
      templateId: template.id,
      sourceMessageId: msg.id,
      includeBranding: true,
      createdAt: now,
      updatedAt: now
    };

    this.cardProjectsStore.set(projectId, project);
    return { success: true, project };
  }

  private async verifyAuth(authHeader: string) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) return undefined;
    const token = authHeader.replace('Bearer ', '').trim();
    return this.authService.getSession(token);
  }
}
