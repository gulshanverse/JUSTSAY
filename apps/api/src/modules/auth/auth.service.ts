import { RegisterRequest, LoginRequest, AuthResponse } from '@justsay/contracts';
import { AuthSessionDto, UserDto } from '@justsay/shared-types';
import { ValidationRules } from '@justsay/validation';
import * as crypto from 'crypto';

interface StoredUser {
  id: string;
  email: string;
  passwordHash: string;
  handle: string;
  displayName: string;
  bio: string;
  avatarUrl?: string;
  activePrompt: string;
  anonymousMessagesEnabled: boolean;
  allowImageMessages: boolean;
  allowReplies: boolean;
  allowReactions: boolean;
  isPublicProfile: boolean;
  createdAt: number;
}

export class AuthService {
  private usersByEmail = new Map<string, StoredUser>();
  private usersByHandle = new Map<string, StoredUser>();
  private sessions = new Map<string, AuthSessionDto>();

  constructor() {
    // Seed default user for test/dev
    const defaultUser: StoredUser = {
      id: 'usr_default_01',
      email: 'user@justsay.app',
      passwordHash: this.hashPassword('Password123!'),
      handle: 'user',
      displayName: 'JUSTSAY Member',
      bio: 'Ask me anything anonymously! 🤫',
      activePrompt: 'send me honest confessions 🤫',
      anonymousMessagesEnabled: true,
      allowImageMessages: false,
      allowReplies: true,
      allowReactions: true,
      isPublicProfile: true,
      createdAt: Date.now()
    };
    this.usersByEmail.set(defaultUser.email.toLowerCase(), defaultUser);
    this.usersByHandle.set(defaultUser.handle.toLowerCase(), defaultUser);
  }

  private hashPassword(password: string, customSalt?: string): string {
    const saltHex = customSalt || crypto.randomBytes(16).toString('hex');
    const derivedKey = crypto.scryptSync(password, saltHex, 64, { N: 131072, r: 8, p: 1, maxmem: 256 * 1024 * 1024 });
    return `$scrypt$N=131072,r=8,p=1$${saltHex}$${derivedKey.toString('hex')}`;
  }

  private parseScryptParams(paramsStr: string): { N: number; r: number; p: number } {
    let N = 131072;
    let r = 8;
    let p = 1;
    const parts = paramsStr.split(',');
    for (const part of parts) {
      const [k, v] = part.split('=');
      if (k === 'N') N = parseInt(v, 10) || 131072;
      if (k === 'r') r = parseInt(v, 10) || 8;
      if (k === 'p') p = parseInt(v, 10) || 1;
    }
    return { N, r, p };
  }

  private verifyPassword(password: string, storedHash: string): boolean {
    if (!storedHash || !storedHash.startsWith('$scrypt$')) return false;
    const parts = storedHash.split('$');
    if (parts.length < 5) return false;
    const paramsStr = parts[2];
    const saltHex = parts[3];
    const expectedHashHex = parts[4];

    const { N, r, p } = this.parseScryptParams(paramsStr);
    const derivedKey = crypto.scryptSync(password, saltHex, 64, { N, r, p, maxmem: 256 * 1024 * 1024 });
    const expectedHashBuffer = Buffer.from(expectedHashHex, 'hex');
    if (derivedKey.length !== expectedHashBuffer.length) return false;
    return crypto.timingSafeEqual(derivedKey, expectedHashBuffer);
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  public async register(req: RegisterRequest): Promise<AuthResponse> {
    const emailVal = ValidationRules.validateEmail(req.email);
    if (!emailVal.isValid) return { success: false, error: emailVal.error };

    const passVal = ValidationRules.validatePassword(req.password);
    if (!passVal.isValid) return { success: false, error: passVal.error };

    const handleVal = ValidationRules.validateUserHandle(req.handle);
    if (!handleVal.isValid) return { success: false, error: handleVal.error };

    const normalizedEmail = req.email.toLowerCase().trim();
    const normalizedHandle = req.handle.toLowerCase().trim();

    if (this.usersByEmail.has(normalizedEmail)) {
      return { success: false, error: 'An account with this email already exists' };
    }

    if (this.usersByHandle.has(normalizedHandle)) {
      return { success: false, error: 'This @handle is already taken' };
    }

    const newUser: StoredUser = {
      id: `usr_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      email: normalizedEmail,
      passwordHash: this.hashPassword(req.password),
      handle: normalizedHandle,
      displayName: req.displayName || req.handle,
      bio: 'Ask me anything anonymously! 🤫',
      activePrompt: 'send me honest confessions 🤫',
      anonymousMessagesEnabled: true,
      allowImageMessages: false,
      allowReplies: true,
      allowReactions: true,
      isPublicProfile: true,
      createdAt: Date.now()
    };

    this.usersByEmail.set(normalizedEmail, newUser);
    this.usersByHandle.set(normalizedHandle, newUser);

    const session = this.createSession(newUser);
    return { success: true, session };
  }

  public async login(req: LoginRequest): Promise<AuthResponse> {
    const normalizedEmail = req.email.toLowerCase().trim();
    const user = this.usersByEmail.get(normalizedEmail);

    if (!user) {
      return { success: false, error: 'Invalid email or password' };
    }

    if (!this.verifyPassword(req.password, user.passwordHash)) {
      return { success: false, error: 'Invalid email or password' };
    }

    // Transparent password hash migration to N=131072 baseline if using older parameters
    if (!user.passwordHash.includes('N=131072')) {
      user.passwordHash = this.hashPassword(req.password);
      this.usersByEmail.set(normalizedEmail, user);
      this.usersByHandle.set(user.handle.toLowerCase(), user);
    }

    const session = this.createSession(user);
    return { success: true, session };
  }

  public async logout(accessToken: string): Promise<boolean> {
    const tokenHash = this.hashToken(accessToken);
    return this.sessions.delete(tokenHash);
  }

  public async getSession(accessToken: string): Promise<AuthSessionDto | undefined> {
    const tokenHash = this.hashToken(accessToken);
    const session = this.sessions.get(tokenHash);
    if (session && session.expiresAt > Date.now()) {
      return session;
    }
    return undefined;
  }

  public getUserByHandle(handle: string): StoredUser | undefined {
    return this.usersByHandle.get(handle.toLowerCase().trim());
  }

  public async updateProfile(handle: string, updates: Partial<StoredUser>): Promise<UserDto | undefined> {
    const user = this.usersByHandle.get(handle.toLowerCase().trim());
    if (!user) return undefined;

    Object.assign(user, updates);
    this.usersByHandle.set(user.handle.toLowerCase(), user);
    this.usersByEmail.set(user.email.toLowerCase(), user);

    return this.toUserDto(user);
  }

  public async deleteAccount(handle: string): Promise<boolean> {
    const user = this.usersByHandle.get(handle.toLowerCase().trim());
    if (!user) return false;

    // Invalidate all active sessions for this account
    for (const [tokenHash, session] of Array.from(this.sessions.entries())) {
      if (session.user.handle.toLowerCase() === user.handle.toLowerCase()) {
        this.sessions.delete(tokenHash);
      }
    }

    this.usersByEmail.delete(user.email.toLowerCase());
    this.usersByHandle.delete(user.handle.toLowerCase());
    return true;
  }

  private createSession(user: StoredUser): AuthSessionDto {
    const accessToken = `session_access_${crypto.randomBytes(32).toString('hex')}`;
    const refreshToken = `session_refresh_${crypto.randomBytes(32).toString('hex')}`;
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days

    const session: AuthSessionDto = {
      accessToken,
      refreshToken,
      user: this.toUserDto(user),
      expiresAt
    };

    const tokenHash = this.hashToken(accessToken);
    this.sessions.set(tokenHash, session);
    return session;
  }

  public toUserDto(user: StoredUser): UserDto {
    return {
      id: user.id,
      email: user.email,
      handle: user.handle,
      displayName: user.displayName,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      activePrompt: user.activePrompt,
      anonymousMessagesEnabled: user.anonymousMessagesEnabled,
      allowImageMessages: user.allowImageMessages,
      allowReplies: user.allowReplies,
      allowReactions: user.allowReactions,
      isPublicProfile: user.isPublicProfile,
      createdAt: user.createdAt
    };
  }
}
