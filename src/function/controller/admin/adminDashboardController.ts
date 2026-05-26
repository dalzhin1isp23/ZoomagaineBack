import { Request, Response, NextFunction } from 'express';
import * as dashboardService from '../../service/adminDashboardService';
import AppError from '../../../utils/AppError';

export const getAdminDashboard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await dashboardService.getAdminDashboard();
    res.status(200).json({ status: 'success', data: result });
  } catch (err) {
    next(err);
  }
};