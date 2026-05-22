import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import * as orderService from '../../service/orderService';
import AppError from '../../../utils/AppError';
import { productUpload, vetDocUpload } from '../../middleware/upload';

export const updateOrderStatusValidation = [
  body('statusName').trim().notEmpty().withMessage('Необходимо указать новый статус')
];

export const createOrderValidation = [
  body('products').isArray({ min: 1 }).withMessage('Заказ должен содержать хотя бы один товар'),
  body('products.*.product').trim().notEmpty().withMessage('ID товара обязателен'),
  body('products.*.quantity').isInt({ min: 1 }).withMessage('Количество должно быть больше 0'),
  body('products.*.price').isNumeric().withMessage('Цена обязательна'),
  body('products.*.name').trim().notEmpty().withMessage('Название товара обязательно'),
  body('sum').isNumeric().withMessage('Сумма заказа обязательна'),
  body('adressPoint').trim().notEmpty().withMessage('Адрес доставки обязателен'),
  body('deliveryMethod').optional().isIn(['courier', 'pickup']),
  body('paymentMethod').optional().isIn(['card', 'cash'])
];

export const createOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new AppError(errors.array()[0].msg, 400);
    
    const userId = req.user?._id?.toString();
    if (!userId) throw new AppError('Требуется авторизация', 401);
    
    const { 
      products, 
      sum, 
      adressPoint, 
      city,
      deliveryMethod, 
      paymentMethod,
      promoCode,
      comment,
      hasVetMedicine,
      vetDocuments 
    } = req.body;
    
    const order = await orderService.createOrder(
      userId,
      products,
      sum,
      adressPoint,
      {
        city,
        deliveryMethod,
        paymentMethod,
        promoCode,
        comment,
        hasVetMedicine,
        vetDocuments
      }
    );
    
    res.status(201).json({ 
      status: 'success', 
      message: 'Заказ успешно создан', 
      data: order 
    });
  } catch (err) { 
    next(err); 
  }
};


export const uploadVetDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log(' uploadVetDocument called');
    console.log(' req.file:', req.file);
    console.log(' req.body:', req.body);
    
    const { orderId } = req.params;
    const userId = req.user?._id?.toString();
    
    if (!userId) throw new AppError('Требуется авторизация', 401);
    
    if (!req.file) {
      console.error(' No file in req.file');
      console.error(' req.files:', (req as any).files);
      throw new AppError('Файл не загружен. Проверьте, что поле называется "document"', 400);
    }
    
    const fileUrl = `/uploads/orders/vet-docs/${req.file.filename}`;
    
    console.log(' Saving vet document:', { orderId, fileUrl, originalName: req.file.originalname });
    
    const order = await orderService.uploadVetDocument(
      orderId, 
      userId, 
      fileUrl, 
      req.file.originalname
    );
    
    res.status(200).json({
      status: 'success',
      message: 'Документ загружен',
      data: order
    });
  } catch (err) {
    console.error(' uploadVetDocument error:', err);
    next(err);
  }
};

export const switchOrderStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new AppError(errors.array()[0].msg, 400);
    
    const { orderId } = req.params;
    const { statusName } = req.body;
    
    const order = await orderService.updateOrderStatus(orderId, statusName);
    
    res.status(200).json({ 
      status: 'success', 
      message: 'Статус заказа изменен', 
      data: order 
    });
  } catch (err) { 
    next(err); 
  }
};

export const removeOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId } = req.params;
    const result = await orderService.removeOrder(orderId);
    
    res.status(200).json({ 
      status: 'success', 
      message: 'Заказ успешно удален', 
      data: result 
    });
  } catch (err) { 
    next(err); 
  }
};

export const getOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id?.toString();
    if (!userId) throw new AppError('Требуется авторизация', 401);
    
    const orders = await orderService.getOrders(userId);
    
    res.status(200).json({ 
      status: 'success', 
      message: 'Заказы успешно загружены', 
      data: orders 
    });
  } catch (err) { 
    next(err); 
  }
};

export const getOrderById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId } = req.params;
    const userId = req.user?._id?.toString();
    
    if (!userId) throw new AppError('Требуется авторизация', 401);
    
    const order = await orderService.getOrderById(orderId, userId);
    
    res.status(200).json({ 
      status: 'success', 
      data: order 
    });
  } catch (err) { 
    next(err); 
  }
};