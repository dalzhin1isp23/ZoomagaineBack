import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getUserByToken, isAdmin } from '../service/authService';
import AppError from '../../utils/AppError';

declare global {
  namespace Express {
    interface Request {
      user?: any;
      auth?: any;
    }
  }
}

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let token: string | undefined;
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new AppError('Пожалуйста, войдите в систему', 401);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      authId: string;
      login: string;
      userId: string;
      role?: string;
    };

    const user = await getUserByToken(decoded.userId);
    
    req.user = user;
    req.auth = { 
      authId: decoded.authId, 
      login: decoded.login,
      role: decoded.role 
    };
    
    next();
  } catch (err: any) {
    if (err.name === 'JsonWebTokenError') {
      return next(new AppError('Недействительный токен', 401));
    }
    if (err.name === 'TokenExpiredError') {
      return next(new AppError('Срок действия токена истек', 401));
    }
    next(err);
  }
};

export const restrictTo = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRoleId = req.user?.role?._id?.toString() || req.user?.role?.toString() || req.auth?.role;
    
    if (!roles.includes(userRoleId)) {
      return next(new AppError('Доступ запрещен: недостаточно прав', 403));
    }
    next();
  };
};

export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id?.toString();
    if (!userId) {
      return next(new AppError('Пользователь не авторизован', 401));
    }

    const admin = await isAdmin(userId);
    if (!admin) {
      return next(new AppError('Требуется роль администратора', 403));
    }

    next();
  } catch (err) {
    next(err);
  }
};