import { CheckHandleResponse } from '@justsay/contracts';
import { ValidationRules } from '@justsay/validation';
import { AuthService } from '../auth/auth.service';
import { RateLimiterService } from '../ratelimit/ratelimit.service';

export class HandlesController {
  private authService: AuthService;
  private rateLimiter: RateLimiterService;

  constructor(authService: AuthService, rateLimiter: RateLimiterService) {
    this.authService = authService;
    this.rateLimiter = rateLimiter;
  }

  public async checkHandle(handle: string, clientIp: string): Promise<CheckHandleResponse> {
    const rateCheck = this.rateLimiter.isAllowed(`handle_check_${clientIp}`);
    if (!rateCheck.allowed) {
      return { handle, available: false, reason: 'Rate limit exceeded' };
    }

    const val = ValidationRules.validateUserHandle(handle);
    if (!val.isValid) {
      return { handle, available: false, reason: val.error };
    }

    const existingUser = this.authService.getUserByHandle(handle);
    if (existingUser) {
      return { handle, available: false, reason: 'Handle is already taken' };
    }

    return { handle, available: true };
  }
}
