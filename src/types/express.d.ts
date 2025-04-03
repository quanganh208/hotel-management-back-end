import { Request } from 'express';

export interface RequestWithUser extends Request {
  user: {
    userId: string;
    email: string;
    name: string;
    accountType: string;
    role: string;
  };
}
