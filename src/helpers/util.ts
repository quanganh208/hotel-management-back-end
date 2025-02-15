import * as bcrypt from 'bcrypt';

const saltRounds: number = 10;

export const hashPassword = async (plainPassword: string): Promise<string> => {
  const salt: string = await bcrypt.genSalt(saltRounds);
  return await bcrypt.hash(plainPassword, salt);
};
