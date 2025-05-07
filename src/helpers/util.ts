import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';

const saltRounds: number = 10;

export const hashPassword = async (plainPassword: string): Promise<string> => {
  const salt: string = await bcrypt.genSalt(saltRounds);
  return await bcrypt.hash(plainPassword, salt);
};

export const comparePasswords = async (
  plainPassword: string,
  hashedPassword: string,
): Promise<boolean> => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};

export const generateResetToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

// 2FA utilities
export const generate2faSecret = (email: string) => {
  return speakeasy.generateSecret({
    name: `HotelManagement:${email}`,
    issuer: 'HotelManagement',
  });
};

export const verify2faToken = (token: string, secret: string): boolean => {
  return speakeasy.totp.verify({
    secret: secret,
    encoding: 'base32',
    token: token,
    window: 1, // Allow 1 step before and after for time drift
  });
};

export const generateQRCodeDataURL = async (
  otpauth_url: string,
): Promise<string> => {
  return await QRCode.toDataURL(otpauth_url);
};

export const generateBackupCodes = (count: number = 10): string[] => {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const code = crypto.randomBytes(4).toString('hex');
    codes.push(code);
  }
  return codes;
};
