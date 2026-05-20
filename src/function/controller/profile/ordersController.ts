import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import * as userService from '../../service/profileService';
import AppError from '../../../utils/AppError';

export const createOrderValidation = [
  body('products').isArray({ min: 1 }).withMessage('Заказ должен содержать хотя бы один товар'),
  body('products.*.product').trim().notEmpty().withMessage('ID товара обязателен'),
  body('products.*.quantity').isInt({ min: 1 }).withMessage('Количество должно быть больше 0'),
  body('sum').isNumeric().withMessage('Сумма заказа обязательна'),
  body('adressPoint').trim().notEmpty().withMessage('Адрес доставки обязателен')
];

export const updateOrderStatusValidation = [body('statusName').trim().notEmpty().withMessage('Необходимо указать новый статус')];

export const createOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new AppError(errors.array()[0].msg, 400);
    const userId = req.user?._id?.toString();
    if (!userId) throw new AppError('Требуется авторизация', 401);
    const { products, sum, adressPoint, dateArrivedPoint, dateSending, dateFinal } = req.body;
    const order = await userService.orderAdd(userId, products, sum, adressPoint, dateArrivedPoint, dateSending, dateFinal);
    res.status(201).json({ status: 'success', message: 'Заказ успешно создан', data: order });
  } catch (err) { next(err); }
};

export const switchOrderStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new AppError(errors.array()[0].msg, 400);
    const { orderId } = req.params;
    const { statusName } = req.body;
    const order = await userService.orderStatusSwitch(orderId, statusName);
    res.status(200).json({ status: 'success', message: 'Статус заказа изменен', data: order });
  } catch (err) { next(err); }
};

export const removeOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId } = req.params;
    const result = await userService.orderRemove(orderId);
    res.status(200).json({ status: 'success', message: 'Заказ успешно удален', data: result });
  } catch (err) { next(err); }
};

export const getOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id?.toString();
    if (!userId) throw new AppError('Требуется авторизация', 401);
    const orders = await userService.getOrders(userId);
    res.status(200).json({ status: 'success', message: 'Заказы успешно загружены', data: orders });
  } catch (err) { next(err); }
};