import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import * as adminUserService from '../../service/adminUserService';
import AppError from '../../../utils/AppError';

export const getAdminUsersValidation = [
  body('search').optional().isString().trim()
];

export const getAdminUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new AppError(errors.array()[0].msg, 400);

    const users = await adminUserService.getAdminUsers({
      search: req.query.search as string
    });

    res.status(200).json({ status: 'success', data: users });
  } catch (err) {
    next(err);
  }
};

export const updateUserRoleValidation = [
  body('roleId').trim().notEmpty().withMessage('ID роли обязателен')
];

export const updateUserRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new AppError(errors.array()[0].msg, 400);

    const { userId } = req.params;
    const { roleId } = req.body; 

    const user = await adminUserService.updateUserRole(userId, roleId);

    res.status(200).json({
      status: 'success',
      message: 'Роль пользователя обновлена',
      data: user
    });
  } catch (err) {
    next(err);
  }
};