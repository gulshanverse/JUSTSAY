import { ModerationStatus } from '@justsay/shared-types';

export interface ServerModerationResult {
  status: ModerationStatus;
  flagReason: string;
  sentiment: string;
}

export class ServerModerationService {
  public async evaluateMessage(messageText: string): Promise<ServerModerationResult> {
    const toxicKeywords = ['hate', 'stupid', 'idiot', 'die', 'threat', 'kill', 'abuse', 'stalk'];
    const lower = messageText.toLowerCase();
    const found = toxicKeywords.filter(k => lower.includes(k));

    if (found.length > 0) {
      return {
        status: ModerationStatus.SOFT_BLOCKED,
        flagReason: `Flagged pattern: [${found.join(', ')}]`,
        sentiment: 'Toxic/Spam'
      };
    }

    return {
      status: ModerationStatus.APPROVED,
      flagReason: '',
      sentiment: 'Positive'
    };
  }
}
