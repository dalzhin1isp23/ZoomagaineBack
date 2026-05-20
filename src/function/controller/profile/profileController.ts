import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import * as profileService from '../../service/profileService';
import AppError from '../../../utils/AppError';

export const updateProfileValidation = [
  body('phone').optional().isString().trim(),
  body('mail').optional().isEmail().normalizeEmail(),

  body('login')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Логин должен содержать от 3 до 30 символов')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Логин может содержать только латинские буквы, цифры, _ и -'),
  
  body('notifications.discounts').optional().isBoolean()
];


export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id?.toString();
    if (!userId) throw new AppError('Требуется авторизация', 401);
    
    const profile = await profileService.getUserProfile(userId);
    
    res.status(200).json({
      status: 'success',
      data: profile
    });
  } catch (err) {
    next(err);
  }
};


export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log(' updateProfile controller called');
    console.log(' Request body:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      throw new AppError(errors.array()[0].msg, 400);
    }
    
    const userId = req.user?._id?.toString();
    if (!userId) throw new AppError('Требуется авторизация', 401);
    
    const updated = await profileService.updateUserProfile(userId, req.body);
    
    console.log(' Profile updated successfully');
    
    res.status(200).json({
      status: 'success',
      message: 'Профиль обновлён',
      data: updated
    });
  } catch (err: any) {
    console.error(' updateProfile error:', err);
    
    if (err.statusCode === 409) {
      return res.status(409).json({
        status: 'error',
        message: err.message,
        field: 'login'
      });
    }
    
    next(err);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(200).json({ status: 'success', message: 'Выход выполнен' });
  } catch (err) {
    next(err);
  }
};