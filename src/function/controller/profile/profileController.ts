import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import * as profileService from '../../service/profileService';
import AppError from '../../../utils/AppError';
import { Users } from '../../../models/Users'; 

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
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new AppError(errors.array()[0].msg, 400);
    
    const userId = req.user?._id?.toString();
    if (!userId) throw new AppError('Требуется авторизация', 401);
    
    const updated = await profileService.updateUserProfile(userId, req.body);
    
    res.status(200).json({
      status: 'success',
      message: 'Профиль обновлён',
      data: updated
    });
  } catch (err: any) {
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

export const uploadAvatar = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id?.toString();
    if (!userId) throw new AppError('Требуется авторизация', 401);
    
    if (!req.file) {
      throw new AppError('Файл не загружен', 400);
    }
    
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    
    
    const updatedUser = await Users.findByIdAndUpdate(
      userId,
      { avatar: avatarUrl },
      { new: true, runValidators: true }
    ).select('phone mail avatar notifications status').lean();
    
    if (!updatedUser) throw new AppError('Не удалось обновить аватар', 500);
    
    res.status(200).json({
      status: 'success',
      message: 'Аватар загружен',
      data: { ...updatedUser, avatar: avatarUrl }
    });
  } catch (err) {
    next(err);
  }
};

export const removeAvatar = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id?.toString();
    if (!userId) throw new AppError('Требуется авторизация', 401);
    
 
    const updatedUser = await Users.findByIdAndUpdate(
      userId,
      { avatar: null },
      { new: true, runValidators: true }
    ).select('phone mail avatar notifications status').lean();
    
    if (!updatedUser) throw new AppError('Не удалось удалить аватар', 500);
    
    res.status(200).json({
      status: 'success',
      message: 'Аватар удалён',
      data: updatedUser
    });
  } catch (err) {
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