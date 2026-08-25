import {
  ModerationStatus,
  ModerationRiskLevel,
  ModerationCategory,
  ModerationResultDto,
  ModerationQueueItemDto
} from '@justsay/shared-types';

export interface ServerModerationResult {
  status: ModerationStatus;
  flagReason: string;
  sentiment: string;
  resultV2: ModerationResultDto;
}

export interface ModerationProvider {
  analyzeText(text: string): Promise<{ categories: ModerationCategory[]; confidence: number }>;
}

export class DefaultKeywordModerationProvider implements ModerationProvider {
  public async analyzeText(text: string): Promise<{ categories: ModerationCategory[]; confidence: number }> {
    const lower = text.toLowerCase();
    const categories: ModerationCategory[] = [];

    if (lower.includes('kill') || lower.includes('threat') || lower.includes('attack')) categories.push('threat');
    if (lower.includes('hate') || lower.includes('racist')) categories.push('hate');
    if (lower.includes('die') || lower.includes('suicide')) categories.push('self_harm');
    if (lower.includes('idiot') || lower.includes('ugly') || lower.includes('loser')) categories.push('harassment');
    if (lower.includes('http://') || lower.includes('crypto') || lower.includes('cash')) categories.push('spam');

    const confidence = categories.length > 0 ? 0.92 : 0.99;
    return { categories, confidence };
  }
}

export class ServerModerationService {
  private queueStore = new Map<string, ModerationQueueItemDto>();
  private provider: ModerationProvider;

  constructor(provider?: ModerationProvider) {
    this.provider = provider || new DefaultKeywordModerationProvider();
  }

  // MODERATION PIPELINE: Normalization -> Spam Check -> Provider Analysis -> Policy Decision
  public async evaluateMessage(messageText: string, messageId?: string, recipientHandle?: string, promptQuestion?: string): Promise<ServerModerationResult> {
    const normalizedText = messageText.trim().replace(/\s+/g, ' ');
    const { categories, confidence } = await this.provider.analyzeText(normalizedText);

    let decision: ModerationStatus = ModerationStatus.APPROVED;
    let riskLevel: ModerationRiskLevel = ModerationRiskLevel.LOW;
    const reasons: string[] = [];

    if (categories.includes('threat') || categories.includes('self_harm')) {
      decision = ModerationStatus.ESCALATED;
      riskLevel = ModerationRiskLevel.CRITICAL;
      reasons.push('High-risk harm or threat keyword detected');
    } else if (categories.includes('hate') || categories.includes('harassment')) {
      decision = ModerationStatus.SOFT_BLOCKED;
      riskLevel = ModerationRiskLevel.HIGH;
      reasons.push('Abusive or harassment content pattern detected');
    } else if (categories.includes('spam') || categories.includes('scam')) {
      decision = ModerationStatus.SOFT_BLOCKED;
      riskLevel = ModerationRiskLevel.MEDIUM;
      reasons.push('Automated spam link or scam pattern detected');
    }

    const resultV2: ModerationResultDto = {
      decision,
      riskLevel,
      categories,
      confidence,
      reasons,
      evaluatedAt: Date.now()
    };

    // Store item in moderation queue if flagged
    if (decision !== ModerationStatus.APPROVED && messageId) {
      const item: ModerationQueueItemDto = {
        id: `mod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        messageId,
        recipientHandle: recipientHandle || 'unknown',
        messageText: normalizedText,
        promptQuestion: promptQuestion || '',
        moderationResult: resultV2,
        status: decision,
        createdAt: Date.now()
      };
      this.queueStore.set(item.id, item);
    }

    return {
      status: decision,
      flagReason: reasons.join('; '),
      sentiment: riskLevel === ModerationRiskLevel.LOW ? 'Positive' : 'Toxic/High-Risk',
      resultV2
    };
  }

  // Admin Queue Actions
  public getPendingQueue(): ModerationQueueItemDto[] {
    return Array.from(this.queueStore.values());
  }

  public getQueueItem(id: string): ModerationQueueItemDto | undefined {
    return this.queueStore.get(id);
  }

  public updateQueueStatus(id: string, status: ModerationStatus): ModerationQueueItemDto | undefined {
    const item = this.queueStore.get(id);
    if (!item) return undefined;
    item.status = status;
    item.moderationResult.decision = status;
    this.queueStore.set(id, item);
    return item;
  }
}
