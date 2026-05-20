import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';

export interface IPayload {
  userId: string;
  login: string;
  role?: string;
}

export const createJWT = (payload: { userId: string | import('mongoose').Types.ObjectId; login: string; role?: string | import('mongoose').Types.ObjectId }): string => {
  return jwt.sign(
    {
      userId: payload.userId.toString(),
      login: payload.login,
      role: payload.role?.toString(),
    },
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_EXPIRE || '1d' }
  );
};