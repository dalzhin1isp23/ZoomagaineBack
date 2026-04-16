import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import * as authService from '../../service/authService';
import AppError from '../../../utils/AppError';

export const registerValidation = [
  body('login').trim().notEmpty().withMessage('Логин обязателен'),
  body('password').isLength({ min: 6 }).withMessage('Пароль мин. 6 символов'),
  body('mail').optional().isEmail().withMessage('Некорректный email')
];

export const loginValidation = [
  body('login').trim().notEmpty().withMessage('Логин обязателен'),
  body('password').notEmpty().withMessage('Пароль обязателен')
];

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(errors.array()[0].msg, 400);
    }

    const { login, password, mail, phone } = req.body;
    const result = await authService.register(login, password, mail, phone);

    res.status(201).json({
      status: 'success',
      message: 'Регистрация успешна',
      data: {
        user: { 
          id: result.user._id, 
          mail: result.user.mail, 
          role: result.user.role 
        },
        token: result.token
      }
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(errors.array()[0].msg, 400);
    }

    const { login, password } = req.body;
    const result = await authService.login(login, password);

    res.status(200).json({
      status: 'success',
      message: 'Вход выполнен',
      data: {
        user: { 
          id: result.user._id, 
          mail: result.user.mail, 
          phone: result.user.phone,
          role: result.user.role,
          status: result.user.status 
        },
        token: result.token
      }
    });
  } catch (err) {
    next(err);
  }
};

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(200).json({
      status: 'success',
      data: { 
        user: {
          id: req.user._id.toString(),
          mail: req.user.mail,
          phone: req.user.phone,
          role: req.user.role?.toString(),
          status: req.user.status
        } 
      }
    });
  } catch (err) {
    next(err);
  }
};

export const assignRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, roleName } = req.body;
    const adminId = req.user._id.toString();

    const result = await authService.assignRole(userId, roleName, adminId);

    res.status(200).json({
      status: 'success',
      message: 'Роль назначена',
      data: result
    });
  } catch (err) {
    next(err);
  }
};