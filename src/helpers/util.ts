import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

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
