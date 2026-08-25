import { SendMessageRequest, SendMessageResponse } from '@justsay/contracts';
import { ServerModerationService } from '../moderation/moderation.service';
import { ValidationRules } from '@justsay/validation';

export class MessagesController {
  private moderationService = new ServerModerationService();

  public async postMessage(req: SendMessageRequest): Promise<SendMessageResponse> {
    const val = ValidationRules.validateMessageText(req.messageText);
    if (!val.isValid) {
      throw new Error(val.error);
    }

    const modResult = await this.moderationService.evaluateMessage(req.messageText);

    return {
      success: true,
      messageId: `msg_${Date.now()}`,
      moderationStatus: modResult.status
    };
  }
}
