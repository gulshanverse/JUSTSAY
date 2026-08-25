export class ValidationRules {
  private static RESERVED_HANDLES = new Set([
    'admin', 'administrator', 'justsay', 'official', 'support', 'help',
    'moderator', 'mod', 'system', 'root', 'security', 'api', 'app',
    'login', 'register', 'auth', 'null', 'undefined', 'dashboard', 'settings'
  ]);

  static validateUserHandle(handle: string): { isValid: boolean; error?: string } {
    if (!handle) {
      return { isValid: false, error: 'Handle cannot be empty' };
    }
    const normalized = handle.toLowerCase().trim();
    if (normalized.length < 3 || normalized.length > 30) {
      return { isValid: false, error: 'Handle must be between 3 and 30 characters' };
    }
    const regex = /^[a-z0-9_]+$/;
    if (!regex.test(normalized)) {
      return { isValid: false, error: 'Handle can only contain lowercase letters, numbers, and underscores' };
    }
    if (this.RESERVED_HANDLES.has(normalized)) {
      return { isValid: false, error: `'${normalized}' is a reserved system handle` };
    }
    return { isValid: true };
  }

  static validateEmail(email: string): { isValid: boolean; error?: string } {
    if (!email || !email.includes('@') || !email.includes('.')) {
      return { isValid: false, error: 'Please enter a valid email address' };
    }
    return { isValid: true };
  }

  static validatePassword(password: string): { isValid: boolean; error?: string } {
    if (!password) {
      return { isValid: false, error: 'Password cannot be empty' };
    }
    if (password.length < 8) {
      return { isValid: false, error: 'Password must be at least 8 characters long' };
    }
    if (password.length > 128) {
      return { isValid: false, error: 'Password cannot exceed 128 characters' };
    }
    return { isValid: true };
  }

  static validateMessageText(text: string): { isValid: boolean; error?: string } {
    if (!text || text.trim().length === 0) {
      return { isValid: false, error: 'Message cannot be empty' };
    }
    if (text.length > 500) {
      return { isValid: false, error: 'Message exceeds 500 characters max limit' };
    }
    return { isValid: true };
  }

  static validateBio(bio: string): { isValid: boolean; error?: string } {
    if (bio && bio.length > 160) {
      return { isValid: false, error: 'Bio must be 160 characters or less' };
    }
    return { isValid: true };
  }
}
