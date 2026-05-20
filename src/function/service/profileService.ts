import mongoose from 'mongoose';
import AppError from '../../utils/AppError';
import { Users } from '../../models/Users';
import { Authorithation } from '../../models/Authorithation';
import { Pet } from '../../models/Pets';
import { Orders } from '../../models/Orders';

const validateLogin = (login: string): string | null => {
  if (!login || login.trim().length < 3) return 'Логин должен содержать минимум 3 символа';
  if (login.trim().length > 30) return 'Логин не должен превышать 30 символов';
  if (!/^[a-zA-Z0-9_-]+$/.test(login.trim())) return 'Логин может содержать только латинские буквы, цифры, _ и -';
  return null;
};

export const getUserProfile = async (userId: string) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) throw new AppError('Неверный ID пользователя', 400);
  const user = await Users.findById(userId).select('phone mail notifications status').lean();
  if (!user) throw new AppError('Пользователь не найден', 404);
  const auth = await Authorithation.findOne({ user: userId }).select('login isVerified').lean();
  return { ...user, login: auth?.login || '', isVerified: auth?.isVerified || false };
};

export const updateUserProfile = async (userId: string, updateData: any) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) throw new AppError('Неверный ID пользователя', 400);
  const currentUser = await Users.findById(userId).select('phone mail').lean();
  const currentAuth = await Authorithation.findOne({ user: userId }).select('login').lean();
  if (!currentUser || !currentAuth) throw new AppError('Пользователь не найден', 404);

  const userSafeData: Record<string, any> = {};
  const authSafeData: Record<string, any> = {};
  let needsAuthUpdate = false;

  if (updateData.phone !== undefined) {
    if (updateData.phone === '' || updateData.phone === null) {
      if (!currentUser.mail || currentUser.mail.trim() === '') throw new AppError('Нельзя удалить телефон: укажите альтернативный email', 400);
      userSafeData.phone = null;
    } else {
      const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?([0-9]{1,4}[-\s\.]?){1,4}[0-9]{1,9}$/;
      if (!phoneRegex.test(updateData.phone)) throw new AppError('Неверный формат телефона', 400);
      userSafeData.phone = updateData.phone.trim();
    }
  }

  if (updateData.mail !== undefined) {
    if (updateData.mail === '' || updateData.mail === null) {
      if (!currentUser.phone || currentUser.phone.trim() === '') throw new AppError('Нельзя удалить email: укажите альтернативный телефон', 400);
      userSafeData.mail = null;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updateData.mail)) throw new AppError('Неверный формат email', 400);
      userSafeData.mail = updateData.mail.toLowerCase().trim();
    }
  }

  if (updateData.login !== undefined) {
    const newLogin = updateData.login.trim();
    const loginError = validateLogin(newLogin);
    if (loginError) throw new AppError(loginError, 400);
    const existingAuth = await Authorithation.findOne({ login: { $regex: `^${newLogin}$`, $options: 'i' }, user: { $ne: userId } });
    if (existingAuth) throw new AppError('Этот логин уже занят', 409);
    authSafeData.login = newLogin;
    needsAuthUpdate = true;
  }

  if (updateData.notifications && typeof updateData.notifications === 'object' && typeof updateData.notifications.discounts === 'boolean') {
    userSafeData['notifications.discounts'] = updateData.notifications.discounts;
  }

  let updatedUser = currentUser;
  let updatedAuth = currentAuth;

  if (Object.keys(userSafeData).length > 0) {
    updatedUser = await Users.findByIdAndUpdate(userId, { $set: userSafeData }, { new: true, runValidators: true, select: 'phone mail notifications status', lean: true });
    if (!updatedUser) throw new AppError('Не удалось обновить профиль', 500);
  }

  if (needsAuthUpdate) {
    updatedAuth = await Authorithation.findOneAndUpdate({ user: userId }, { $set: authSafeData }, { new: true, runValidators: true, select: 'login isVerified', lean: true });
    if (!updatedAuth) throw new AppError('Не удалось обновить логин', 500);
  }

  return { ...updatedUser, login: updatedAuth?.login || currentAuth.login, isVerified: updatedAuth?.isVerified || currentAuth.isVerified };
};

export const getPets = async (userId: string) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) throw new AppError('Неверный ID пользователя', 400);
  return Pet.find({ owner: userId }).sort({ createdAt: -1 }).lean();
};

export const petAdd = async (
  userId: string,
  name: string,
  animal: string,
  bornDate?: Date,
  gender?: string,
  photoUrl?: string,
  breed?: string,
  tags?: string[],
  folderColor?: string
) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) throw new AppError('Неверный ID пользователя', 400);
  
  const pet = new Pet({
    name,
    animal,
    bornDate: bornDate ? new Date(bornDate) : undefined,
    gender,
    photoUrl: photoUrl || '',
    breed: breed || '',
    tags: tags || [],
    folderColor: folderColor || '#234cd3',
    owner: userId
  });
  
  return pet.save();
};

export const updateProfilePet = async (petId: string, updateData: any) => {
  if (!mongoose.Types.ObjectId.isValid(petId)) throw new AppError('Неверный ID питомца', 400);
  const allowedUpdates = ['name', 'animal', 'bornDate', 'gender', 'breed', 'photoUrl', 'tags', 'folderColor'];
  const updates: Record<string, any> = {};
  Object.keys(updateData).forEach(key => {
    if (allowedUpdates.includes(key)) updates[key] = updateData[key];
  });
  const pet = await Pet.findOneAndUpdate({ _id: petId }, { $set: updates }, { new: true }).lean();
  if (!pet) throw new AppError('Питомец не найден', 404);
  return pet;
};

export const favAddPet = async (petId: string, productId: string, reason?: string) => {
  if (!mongoose.Types.ObjectId.isValid(petId) || !mongoose.Types.ObjectId.isValid(productId)) throw new AppError('Неверный ID', 400);
  const pet = await Pet.findById(petId);
  if (!pet) throw new AppError('Питомец не найден', 404);
  const exists = pet.personalWishlist?.some((w: any) => w.product.toString() === productId);
  if (!exists) {
    pet.personalWishlist.push({ product: productId, reason });
    await pet.save();
  }
  return pet;
};

export const getFavorites = async (userId: string) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) throw new AppError('Неверный ID пользователя', 400);
  const user = await Users.findById(userId).populate({ path: 'favorites', populate: { path: 'product', select: 'name price photoUrl' } }).select('favorites').lean();
  if (!user) throw new AppError('Пользователь не найден', 404);
  return user.favorites || [];
};

export const favoriteToggle = async (userId: string, productId: string) => {
  if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(productId)) throw new AppError('Неверный ID', 400);
  const user = await Users.findById(userId);
  if (!user) throw new AppError('Пользователь не найден', 404);
  const favoriteIndex = user.favorites?.findIndex((f: any) => f.toString() === productId);
  if (favoriteIndex !== undefined && favoriteIndex !== -1) {
    user.favorites.splice(favoriteIndex, 1);
  } else {
    if (!user.favorites) user.favorites = [];
    user.favorites.push(productId);
  }
  await user.save();
  return getFavorites(userId);
};

export const getOrders = async (userId: string) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) throw new AppError('Неверный ID пользователя', 400);
  return Orders.find({ user: userId }).populate('products.product', 'name price photoUrl').populate('pet', 'name animal photoUrl').sort({ createdAt: -1 }).lean();
};

export const orderAdd = async (userId: string, products: any[], sum: number, adressPoint: string, dateArrivedPoint?: Date, dateSending?: Date, dateFinal?: Date) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) throw new AppError('Неверный ID пользователя', 400);
  const order = new Orders({ user: userId, products, sum, adressPoint, dateArrivedPoint, dateSending, dateFinal });
  return order.save();
};

export const orderStatusSwitch = async (orderId: string, statusName: string) => {
  if (!mongoose.Types.ObjectId.isValid(orderId)) throw new AppError('Неверный ID заказа', 400);
  const order = await Orders.findById(orderId);
  if (!order) throw new AppError('Заказ не найден', 404);
  order.status = statusName;
  order.updatedAt = new Date();
  return order.save();
};

export const orderRemove = async (orderId: string) => {
  if (!mongoose.Types.ObjectId.isValid(orderId)) throw new AppError('Неверный ID заказа', 400);
  const order = await Orders.findByIdAndDelete(orderId);
  if (!order) throw new AppError('Заказ не найден', 404);
  return order;
};

export const uploadPhotoService = async (petId: string, userId: string, fileUrl: string) => {
  if (!mongoose.Types.ObjectId.isValid(petId)) throw new AppError('Неверный ID питомца', 400);
  const pet = await Pet.findOneAndUpdate({ _id: petId, owner: userId }, { photoUrl: fileUrl }, { new: true }).lean();
  if (!pet) throw new AppError('Питомец не найден', 404);
  return pet;
};

export const uploadDocumentService = async (petId: string, userId: string, fileUrl: string, title: string, fileType?: string) => {
  if (!mongoose.Types.ObjectId.isValid(petId)) throw new AppError('Неверный ID питомца', 400);
  const pet = await Pet.findOneAndUpdate({ _id: petId, owner: userId }, { $push: { documents: { title, fileUrl, fileType, uploadedAt: new Date(), isVerified: false } } }, { new: true }).lean();
  if (!pet) throw new AppError('Питомец не найден', 404);
  return pet;
};