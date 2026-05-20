import mongoose from 'mongoose';
import AppError from '../../../utils/AppError';
import { Users } from '../../../models/Users';


export const getUserProfile = async (userId: string) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new AppError('Неверный ID пользователя', 400);
    }

    const user = await Users.findById(userId)
      .select('phone mail notifications status')
      .lean();
    
    if (!user) {
      throw new AppError('Пользователь не найден', 404);
    }
    
    return user;
  } catch (error: any) {
    console.error('getUserProfile error:', error);
    if (error instanceof AppError) throw error;
    throw new AppError(error.message || 'Ошибка загрузки профиля', 500);
  }
};

export const updateUserProfile = async (
  userId: string,
  updateData: Partial<{
    phone?: string;
    mail?: string;
    notifications?: { discounts?: boolean };
  }>
) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new AppError('Неверный ID пользователя', 400);
    }

    console.log(' updateUserProfile input:', { userId, updateData });


    const currentUser = await Users.findById(userId).select('phone mail').lean();
    if (!currentUser) {
      throw new AppError('Пользователь не найден', 404);
    }

    const safeData: Record<string, any> = {};


    const newPhone = updateData.phone;
    const newMail = updateData.mail;
    const currentPhone = currentUser.phone;
    const currentMail = currentUser.mail;


    if (newPhone === '' || newPhone === null) {
      if (!currentMail || currentMail.trim() === '') {
        throw new AppError('Нельзя удалить телефон: укажите альтернативный email', 400);
      }
      safeData.phone = null;
    } 
  
    else if (newMail === '' || newMail === null) {
      if (!currentPhone || currentPhone.trim() === '') {
        throw new AppError('Нельзя удалить email: укажите альтернативный телефон', 400);
      }
      safeData.mail = null;
    } 
  
    else if (newPhone !== undefined) {
      const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?([0-9]{1,4}[-\s\.]?){1,4}[0-9]{1,9}$/;
      if (newPhone && !phoneRegex.test(newPhone)) {
        throw new AppError('Неверный формат телефона', 400);
      }
      safeData.phone = newPhone.trim();
    }

    if (newMail !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (newMail && !emailRegex.test(newMail)) {
        throw new AppError('Неверный формат email', 400);
      }
      safeData.mail = newMail ? newMail.toLowerCase().trim() : null;
    }

    if (updateData.notifications && typeof updateData.notifications === 'object') {
      if (typeof updateData.notifications.discounts === 'boolean') {
        safeData['notifications.discounts'] = updateData.notifications.discounts;
      }
    }

    if (Object.keys(safeData).length === 0) {
      console.log(' No valid data to update');
      return currentUser;
    }

    console.log(' Data to save:', safeData);

    const updated = await Users.findByIdAndUpdate(
      userId,
      { $set: safeData },
      { 
        new: true, 
        runValidators: true,
        select: 'phone mail notifications status',
        lean: true 
      }
    );

    if (!updated) {
      throw new AppError('Не удалось обновить профиль', 500);
    }
    
    console.log('Update result:', updated);
    return updated;
  } catch (error: any) {
    console.error('updateUserProfile error:', error);
    if (error instanceof AppError) throw error;
    throw new AppError(error.message || 'Ошибка обновления профиля', 500);
  }
};