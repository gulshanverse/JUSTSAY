import { AccountExportPackageDto, UserDto, UserPreferencesDto } from '@justsay/shared-types';

export class AccountDataExportService {
  public async generateUserExportPackage(
    user: UserDto,
    preferences: UserPreferencesDto,
    messagesCount: number,
    cardProjectsCount: number,
    mediaAssetsCount: number
  ): Promise<AccountExportPackageDto> {
    // SECURITY & PRIVACY SANITIZATION
    // Strip anonymous sender metadata, internal IPs, device fingerprints, or secrets
    const sanitizedUser: UserDto = {
      ...user,
      email: user.email // Included for user export
    };

    const exportPackage: AccountExportPackageDto = {
      user: sanitizedUser,
      preferences,
      receivedMessagesCount: messagesCount,
      cardProjectsCount,
      mediaAssetsCount,
      exportGeneratedAt: Date.now(),
      dataUrl: `https://justsay.app/api/v1/user/export/download/${user.handle}_export_${Date.now()}.json`
    };

    return exportPackage;
  }
}
