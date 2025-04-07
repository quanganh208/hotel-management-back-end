export declare const hashPassword: (plainPassword: string) => Promise<string>;
export declare const comparePasswords: (plainPassword: string, hashedPassword: string) => Promise<boolean>;
export declare const generateResetToken: () => string;
