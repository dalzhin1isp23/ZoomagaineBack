import mongoose from 'mongoose';
import AppError from '../../utils/AppError';
import { Users } from '../../models/Users';

export const getAdminUsers = async (filters?: { search?: string }) => {
  const query: any = {};
  
  if (filters?.search) {
    query.$or = [
      { login: { $regex: filters.search, $options: 'i' } },
      { mail: { $regex: filters.search, $options: 'i' } },
      { phone: { $regex: filters.search, $options: 'i' } }
    ];
  }

  return Users.find(query)
    .populate('role', 'name')
    .select('login mail phone createdAt role')
    .sort({ createdAt: -1 })
    .lean();
};

export const updateUserRole = async (userId: string, roleId: string) => {

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new AppError('Неверный ID пользователя', 400);
  }
  if (!mongoose.Types.ObjectId.isValid(roleId)) {
    throw new AppError('Неверный ID роли', 400);
  }

  const updated = await Users.findByIdAndUpdate(
    userId,
    { role: new mongoose.Types.ObjectId(roleId) },
    { new: true, runValidators: true }
  ).populate('role', 'name').lean();

  if (!updated) {
    throw new AppError('Пользователь не найден', 404);
  }

  return updated;
};