export class ValidationRules {
  static validateUserHandle(handle: String): boolean {
    const regex = /^[a-zA-Z0-9_]{3,20}$/;
    return regex.test(handle.toString());
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
}
