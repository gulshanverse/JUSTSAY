export declare class ValidationRules {
    private static RESERVED_HANDLES;
    static validateUserHandle(handle: string): {
        isValid: boolean;
        error?: string;
    };
    static validateEmail(email: string): {
        isValid: boolean;
        error?: string;
    };
    static validatePassword(password: string): {
        isValid: boolean;
        error?: string;
    };
    static validateMessageText(text: string): {
        isValid: boolean;
        error?: string;
    };
    static validateBio(bio: string): {
        isValid: boolean;
        error?: string;
    };
}
