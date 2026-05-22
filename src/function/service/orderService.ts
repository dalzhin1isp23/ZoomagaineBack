import mongoose from 'mongoose';
import AppError from '../../utils/AppError';
import { Orders } from '../../models/Orders';
import { Products } from '../../models/Products';

export const createOrder = async (
  userId: string,
  products: Array<{ product: string; quantity: number; price: number; name: string }>,
  sum: number,
  adressPoint: string,
  options: {
    city?: string;
    deliveryMethod?: 'courier' | 'pickup';
    paymentMethod?: 'card' | 'cash';
    promoCode?: string;
    comment?: string;
    vetDocuments?: Array<{ url: string; filename: string }>;
    hasVetMedicine?: boolean;
  } = {}
) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new AppError('Неверный ID пользователя', 400);
  }


  if (options.hasVetMedicine && (!options.vetDocuments || options.vetDocuments.length === 0)) {
    throw new AppError('Для ветеринарных препаратов необходимо загрузить рецепт или документ', 400);
  }

  const productIds = products.map(p => p.product);
  const existingProducts = await Products.find({ _id: { $in: productIds } }).lean();
  
  if (existingProducts.length !== products.length) {
    throw new AppError('Один или несколько товаров больше не доступны', 400);
  }

 
  for (const item of products) {
    const product = existingProducts.find(p => p._id.toString() === item.product);
    if (product && (product.remains ?? 0) < item.quantity) {
      throw new AppError(`Товар "${product.name}" доступен только в количестве ${product.remains} шт`, 400);
    }
  }

  const order = new Orders({
    user: userId,
    products,
    sum,
    adressPoint,
    city: options.city,
    deliveryMethod: options.deliveryMethod || 'courier',
    paymentMethod: options.paymentMethod || 'card',
    promoCode: options.promoCode,
    comment: options.comment,
    hasVetMedicine: options.hasVetMedicine || false,
    vetDocuments: options.vetDocuments || [],
    dateArrivedPoint: options.deliveryMethod === 'pickup' ? new Date() : undefined
  });

  await order.save();


  for (const item of products) {
    await Products.findByIdAndUpdate(item.product, {
      $inc: { remains: -item.quantity }
    });
  }

  return order.populate([
    { path: 'products.product', select: 'name price images' },
    { path: 'status', select: 'name' }
  ]);
};

export const getOrders = async (userId: string) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new AppError('Неверный ID пользователя', 400);
  }
  
  return Orders.find({ user: userId })
    .populate('products.product', 'name price images remains')
    .populate('status', 'name')
    .sort({ createdAt: -1 })
    .lean();
};

export const getOrderById = async (orderId: string, userId: string) => {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new AppError('Неверный ID заказа', 400);
  }
  
  const order = await Orders.findOne({ _id: orderId, user: userId })
    .populate('products.product', 'name price images')
    .populate('status', 'name')
    .lean();
    
  if (!order) throw new AppError('Заказ не найден', 404);
  return order;
};

export const updateOrderStatus = async (orderId: string, statusName: string) => {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new AppError('Неверный ID заказа', 400);
  }
  
  const order = await Orders.findById(orderId);
  if (!order) throw new AppError('Заказ не найден', 404);
  
  order.status = statusName;
  order.updatedAt = new Date();
  
  if (statusName === 'Отправлен') {
    order.dateSending = new Date();
  }
  if (statusName === 'Доставлен') {
    order.dateFinal = new Date();
  }
  
  return order.save();
};

export const removeOrder = async (orderId: string) => {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new AppError('Неверный ID заказа', 400);
  }
  
  const order = await Orders.findByIdAndDelete(orderId);
  if (!order) throw new AppError('Заказ не найден', 404);
  
 
  for (const item of order.products) {
    await Products.findByIdAndUpdate(item.product, {
      $inc: { remains: item.quantity }
    });
  }
  
  return order;
};

export const uploadVetDocument = async (
  orderId: string, 
  userId: string, 
  fileUrl: string, 
  filename: string
) => {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new AppError('Неверный ID заказа', 400);
  }

  const order = await Orders.findOneAndUpdate(
    { _id: orderId, user: userId },
    { 
      $push: { 
        vetDocuments: { 
          url: fileUrl, 
          filename: filename,
          uploadedAt: new Date() 
        } 
      },
      hasVetMedicine: true
    },
    { new: true }
  )
  .populate('products.product', 'name isVetMedicine')
  .lean();
  
  if (!order) {
    throw new AppError('Заказ не найден или не принадлежит пользователю', 404);
  }
  
  return order;
};