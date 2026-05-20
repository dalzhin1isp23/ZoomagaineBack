import { Request, Response, NextFunction } from 'express';
import { param, validationResult } from 'express-validator';
import * as userService from '../../service/profileService';
import AppError from '../../../utils/AppError';

export const toggleFavoriteValidation = [param('productId').trim().notEmpty().withMessage('Необходимо указать ID товара')];

export const toggleFavorite = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new AppError(errors.array()[0].msg, 400);
    const userId = req.user?._id?.toString();
    if (!userId) throw new AppError('Требуется авторизация', 401);
    const { productId } = req.params;
    const result = await userService.favoriteToggle(userId, productId);
    res.status(200).json({ status: 'success', message: 'Избранное успешно обновлено', data: result });
  } catch (err) { next(err); }
};

export const getFavorites = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id?.toString();
    if (!userId) throw new AppError('Требуется авторизация', 401);
    const favorites = await userService.getFavorites(userId);
    res.status(200).json({ status: 'success', message: 'Избранное успешно загружено', data: favorites });
  } catch (err) { next(err); }
};