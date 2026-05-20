import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import * as authService from '../../service/authService';
import AppError from '../../../utils/AppError';

export const registerValidation = [
  body('login').trim().notEmpty().withMessage('Логин обязателен'),
  body('password').isLength({ min: 6 }).withMessage('Пароль должен содержать минимум 6 символов'),
  body('mail').optional().isEmail().withMessage('Некорректный email'),
  body('phone').optional().trim()
];

export const loginValidation = [
  body('login').trim().notEmpty().withMessage('Логин обязателен'),
  body('password').trim().notEmpty().withMessage('Пароль обязателен')
];

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new AppError(errors.array()[0].msg, 400);
    
    const { login, password, mail, phone } = req.body;
    const result = await authService.register(login.trim(), password, mail, phone);
    
    res.status(201).json({
      status: 'success',
      message: 'Пользователь успешно зарегистрирован',
      data: result
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new AppError(errors.array()[0].msg, 400);
    
    const { login, password } = req.body;
    const result = await authService.login(login.trim(), password);
    
    res.status(200).json({
      status: 'success',
      message: 'Вход выполнен успешно',
      data: result
    });
  } catch (err) {
    next(err);
  }
};

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id?.toString();
    if (!userId) throw new AppError('Требуется авторизация', 401);
    
    const user = await authService.getUserByToken(userId);
    
    res.status(200).json({
      status: 'success',
      message: 'Профиль загружен',
      data: user
    });
  } catch (err) {
    next(err);
  }
};

export const assignRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { targetUserId, roleName } = req.body;
    const adminUserId = req.user?._id?.toString();
    
    if (!adminUserId) throw new AppError('Требуется авторизация', 401);
    
    const result = await authService.assignRole(targetUserId, roleName, adminUserId);
    
    res.status(200).json({
      status: 'success',
      message: 'Роль успешно назначена',
      data: result
    });
  } catch (err) {
    next(err);
  }
};