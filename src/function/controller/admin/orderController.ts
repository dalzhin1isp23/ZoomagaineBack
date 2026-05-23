import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import * as adminOrderService from '../../service/adminOrderService';
import AppError from '../../../utils/AppError';

export const getAdminOrdersValidation = [
  body('status').optional().isString(),
  body('search').optional().isString().trim(),
  body('dateFrom').optional().isISO8601(),
  body('dateTo').optional().isISO8601(),
  body('hasVetMedicine').optional().isBoolean(),
  body('limit').optional().isInt({ min: 1, max: 100 }),
  body('page').optional().isInt({ min: 1 })
];

export const getAdminOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'fail', message: errors.array()[0].msg });
    }

    const filters = {
      status: req.query.status as string,
      search: req.query.search as string,
      dateFrom: req.query.dateFrom as string,
      dateTo: req.query.dateTo as string,
      hasVetMedicine: req.query.hasVetMedicine === 'true',
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      page: req.query.page ? parseInt(req.query.page as string, 10) : undefined
    };

    const result = await adminOrderService.getAdminOrders(filters);

    res.status(200).json({ status: 'success', data: result });
  } catch (err) {
    next(err);
  }
};

export const getAdminOrderById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId } = req.params;
    const order = await adminOrderService.getAdminOrderById(orderId);
    res.status(200).json({ status: 'success', data: order });
  } catch (err) {
    next(err);
  }
};

export const updateAdminOrderStatusValidation = [
  body('statusName').trim().notEmpty().withMessage('Статус обязателен')
];

export const updateAdminOrderStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'fail', message: errors.array()[0].msg });
    }

    const { orderId } = req.params;
    const { statusName } = req.body;

    console.log(' [Controller] Updating status:', { orderId, statusName });

    const order = await adminOrderService.updateAdminOrderStatus(orderId, statusName);

    console.log(' [Controller] Status updated:', order?._id);

    res.status(200).json({
      status: 'success',
      message: 'Статус заказа обновлён',
      data: order
    });
  } catch (err: any) {
    console.error('[Controller] updateAdminOrderStatus error:', {
      message: err.message,
      stack: err.stack,
      name: err.name
    });
    next(err);
  }
};

export const verifyVetDocumentsValidation = [
  body('isVerified').isBoolean().withMessage('Требуется булево значение'),
  body('adminNote').optional().isString().trim()
];

export const verifyVetDocuments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'fail', message: errors.array()[0].msg });
    }

    const { orderId } = req.params;
    const { isVerified, adminNote } = req.body;

    console.log(' [Controller] Verifying vet documents:', { orderId, isVerified, adminNote });

    const order = await adminOrderService.verifyVetDocuments(orderId, isVerified, adminNote);

    console.log(' [Controller] Vet documents verified:', order?._id);

    res.status(200).json({
      status: 'success',
      message: isVerified ? 'Документы подтверждены' : 'Документы отклонены',
      data: order
    });
  } catch (err: any) {
    console.error(' [Controller] verifyVetDocuments error:', {
      message: err.message,
      stack: err.stack,
      name: err.name
    });
    next(err);
  }
};

export const deleteAdminOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId } = req.params;
    await adminOrderService.deleteAdminOrder(orderId);
    res.status(200).json({ status: 'success', message: 'Заказ удалён' });
  } catch (err) {
    next(err);
  }
};