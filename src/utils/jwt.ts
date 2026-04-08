import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';

interface IPayload {
  userId: Types.ObjectId;
  login: string;
  role?: Types.ObjectId;
}

export const createJWT = (payload: IPayload): string => {
  return jwt.sign(
    {
      userId: payload.userId,
      login: payload.login,
      role: payload.role
    },
    process.env.JWT_SECRET as string,
    {
      expiresIn: process.env.JWT_EXPIRE || '1d'
    }
  );
};