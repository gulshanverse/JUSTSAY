import { UserProfileDto } from '@justsay/shared-types';
import { UpdateProfileRequest } from '@justsay/contracts';
import { AuthService } from '../auth/auth.service';
import { ValidationRules } from '@justsay/validation';

export class UsersController {
  private authService: AuthService;

  constructor(authService: AuthService) {
    this.authService = authService;
  }

  public async getPublicProfile(handle: string): Promise<UserProfileDto | null> {
    const user = this.authService.getUserByHandle(handle);
    if (!user || !user.isPublicProfile) {
      return null;
    }

    return {
      id: user.id,
      handle: user.handle,
      displayName: user.displayName,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      promptQuestion: user.activePrompt,
      activeTheme: 'Default',
      anonymousMessagesEnabled: user.anonymousMessagesEnabled,
      allowImageMessages: user.allowImageMessages,
      allowReplies: user.allowReplies,
      allowReactions: user.allowReactions,
      isPublicProfile: user.isPublicProfile
    };
  }

  public async updateProfile(authHeader: string, updates: UpdateProfileRequest) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { success: false, error: 'Unauthorized' };
    }
    const token = authHeader.replace('Bearer ', '').trim();
    const session = await this.authService.getSession(token);

    if (!session) {
      return { success: false, error: 'Session invalid or expired' };
    }

    if (updates.bio !== undefined) {
      const bioVal = ValidationRules.validateBio(updates.bio);
      if (!bioVal.isValid) return { success: false, error: bioVal.error };
    }

    const patchPayload: Record<string, any> = {};
    if (updates.displayName !== undefined) patchPayload.displayName = updates.displayName;
    if (updates.bio !== undefined) patchPayload.bio = updates.bio;
    if (updates.avatarUrl !== undefined) patchPayload.avatarUrl = updates.avatarUrl;
    if (updates.promptQuestion !== undefined) patchPayload.activePrompt = updates.promptQuestion;
    if (updates.anonymousMessagesEnabled !== undefined) patchPayload.anonymousMessagesEnabled = updates.anonymousMessagesEnabled;
    if (updates.allowImageMessages !== undefined) patchPayload.allowImageMessages = updates.allowImageMessages;
    if (updates.allowReplies !== undefined) patchPayload.allowReplies = updates.allowReplies;
    if (updates.allowReactions !== undefined) patchPayload.allowReactions = updates.allowReactions;
    if (updates.isPublicProfile !== undefined) patchPayload.isPublicProfile = updates.isPublicProfile;

    const updatedUser = await this.authService.updateProfile(session.user.handle, patchPayload);

    if (!updatedUser) {
      return { success: false, error: 'Failed to update profile' };
    }

    return { success: true, user: updatedUser };
  }

  public async deleteAccount(authHeader: string): Promise<{ success: boolean; error?: string }> {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { success: false, error: 'Unauthorized' };
    }
    const token = authHeader.replace('Bearer ', '').trim();
    const session = await this.authService.getSession(token);

    if (!session) {
      return { success: false, error: 'Session invalid or expired' };
    }

    const deleted = await this.authService.deleteAccount(session.user.handle);
    if (!deleted) {
      return { success: false, error: 'Account not found or already deleted' };
    }

    return { success: true };
  }
}
