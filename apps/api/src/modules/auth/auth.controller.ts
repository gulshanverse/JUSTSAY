import { RegisterRequest, LoginRequest, AuthResponse, RefreshTokenRequest } from '@justsay/contracts';
import { AuthService } from './auth.service';
import { RateLimiterService } from '../ratelimit/ratelimit.service';

export class AuthController {
  private authService: AuthService;
  private rateLimiter: RateLimiterService;

  constructor(authService: AuthService, rateLimiter: RateLimiterService) {
    this.authService = authService;
    this.rateLimiter = rateLimiter;
  }

  public async register(req: RegisterRequest, clientIp: string): Promise<AuthResponse> {
    const rateCheck = this.rateLimiter.isAllowed(`auth_reg_${clientIp}`);
    if (!rateCheck.allowed) {
      return { success: false, error: `Too many registration attempts. Please try again in ${rateCheck.retryAfterSeconds}s.` };
    }
    return this.authService.register(req);
  }

  public async login(req: LoginRequest, clientIp: string): Promise<AuthResponse> {
    const rateCheck = this.rateLimiter.isAllowed(`auth_login_${clientIp}`);
    if (!rateCheck.allowed) {
      return { success: false, error: `Too many login attempts. Please try again in ${rateCheck.retryAfterSeconds}s.` };
    }
    return this.authService.login(req);
  }

  public async logout(authHeader?: string): Promise<{ success: boolean }> {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { success: false };
    }
    const token = authHeader.replace('Bearer ', '').trim();
    const success = await this.authService.logout(token);
    return { success };
  }

  public async getCurrentUser(authHeader?: string) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { authenticated: false, error: 'Unauthorized' };
    }
    const token = authHeader.replace('Bearer ', '').trim();
    const session = await this.authService.getSession(token);
    if (!session) {
      return { authenticated: false, error: 'Session expired or invalid' };
    }
    return { authenticated: true, user: session.user };
  }
}
