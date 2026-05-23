import mongoose from 'mongoose';
import AppError from '../../utils/AppError';
import { Orders } from '../../models/Orders';
import { Products } from '../../models/Products';

export const STATUS_ID_MAP: Record<string, string> = {
  'Новый': '6a0d78968c9a243088c4b24b',
  'В обработке': '6a0d78968c9a243088c4b24c',
  'Отправлен': '6a0d78968c9a243088c4b24c',
  'Доставлен': '6a0d78968c9a243088c4b24d',
  'Отменён': '6a0d78968c9a243088c4b24e'
};

export const STATUS_NAME_MAP: Record<string, string> = {
  '6a0d78968c9a243088c4b24b': 'Новый',
  '6a0d78968c9a243088c4b24c': 'В обработке',
  '6a0d78968c9a243088c4b24d': 'Доставлен',
  '6a0d78968c9a243088c4b24e': 'Отменён'
};

export interface AdminOrderFilter {
  status?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  hasVetMedicine?: boolean;
  limit?: number;
  page?: number;
}

export const getAdminOrders = async (filters: AdminOrderFilter = {}) => {
  const { status, search, dateFrom, dateTo, hasVetMedicine, limit = 50, page = 1 } = filters;
  const query: Record<string, any> = {};

  if (status && status !== 'all') {
    query.status = STATUS_ID_MAP[status] || status;
  }
  if (search) {
    query.$or = [
      { adressPoint: { $regex: search, $options: 'i' } },
      { city: { $regex: search, $options: 'i' } }
    ];
  }
  if (dateFrom || dateTo) {
    query.createdAt = {};
    if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
    if (dateTo) query.createdAt.$lte = new Date(dateTo);
  }
  if (hasVetMedicine === true) {
    query.hasVetMedicine = true;
  }

  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    Orders.find(query)
      .populate('user', 'login mail phone')
      .populate('products.product', 'name price images isVetMedicine remains')

      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Orders.countDocuments(query)
  ]);

  return { orders, total, page, totalPages: Math.ceil(total / limit) };
};

export const getAdminOrderById = async (orderId: string) => {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new AppError('Неверный ID заказа', 400);
  }

  const order = await Orders.findById(orderId)
    .populate('user', 'login mail phone')
    .populate('products.product', 'name price images isVetMedicine remains')

    .lean();

  if (!order) {
    throw new AppError('Заказ не найден', 404);
  }

  return order;
};

export const updateAdminOrderStatus = async (orderId: string, statusName: string) => {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new AppError('Неверный ID заказа', 400);
  }

  const statusId = STATUS_ID_MAP[statusName];
  if (!statusId) {
    throw new AppError(`Неизвестный статус: ${statusName}`, 400);
  }

  const order = await Orders.findById(orderId);
  if (!order) {
    throw new AppError('Заказ не найден', 404);
  }

  order.status = new mongoose.Types.ObjectId(statusId);
  order.updatedAt = new Date();

  if (statusName === 'Отправлен' || statusName === 'В обработке') {
    order.dateSending = new Date();
  }
  if (statusName === 'Доставлен') {
    order.dateFinal = new Date();
    order.payed = true;
  }

  await order.save();

  return await Orders.findById(order._id)
    .populate('user', 'login mail phone')
    .populate('products.product', 'name price images isVetMedicine')
    .lean();
};

export const verifyVetDocuments = async (orderId: string, isVerified: boolean, adminNote?: string) => {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new AppError('Неверный ID заказа', 400);
  }

  const order = await Orders.findById(orderId);
  if (!order) {
    throw new AppError('Заказ не найден', 404);
  }
  if (!order.hasVetMedicine) {
    throw new AppError('Нет ветпрепаратов', 400);
  }

  // Безопасное обновление поддокументов
  const updatedDocs = order.vetDocuments.map((doc: any) => {
    const plain = doc.toObject ? doc.toObject() : doc;
    return {
      ...plain,
      isVerified,
      verifiedAt: isVerified ? new Date() : plain.verifiedAt,
      adminNote: adminNote || plain.adminNote
    };
  });

  await Orders.findByIdAndUpdate(
    orderId,
    {
      $set: { vetDocuments: updatedDocs, updatedAt: new Date() }
    },
    { new: true }
  );

  return await Orders.findById(orderId)
    .populate('products.product', 'name price images isVetMedicine')
    .lean();
};

export const deleteAdminOrder = async (orderId: string) => {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new AppError('Неверный ID заказа', 400);
  }
  const order = await Orders.findByIdAndDelete(orderId);
  if (!order) {
    throw new AppError('Заказ не найден', 404);
  }
  for (const item of order.products) {
    await Products.findByIdAndUpdate(item.product, { $inc: { remains: item.quantity } });
  }
  return order;
};