import mongoose from "mongoose";
import AppError from "../../utils/AppError";


const SettingsSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  notifications: {
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: false },
    push: { type: Boolean, default: true }
  },
  language: { type: String, enum: ['ru', 'en'], default: 'ru' },
  currency: { type: String, enum: ['RUB', 'USD', 'EUR'], default: 'RUB' },
  theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' }
}, { timestamps: true });


const Settings = mongoose.models.Settings || mongoose.model("Settings", SettingsSchema);


export const getUserSettings = async (userId: string) => {
  try {
    let settings = await Settings.findOne({ user: userId }).lean();
    
    if (!settings) {
      
      settings = await Settings.create({
        user: userId,
        notifications: { email: true, sms: false, push: true },
        language: 'ru',
        currency: 'RUB',
        theme: 'system'
      });
    }
    return settings;
  } catch (error) {
    console.error('getUserSettings error:', error);
    throw new AppError('Ошибка загрузки настроек', 500);
  }
};


export const updateUserSettings = async (
  userId: string,
  updateData: Partial<{
    notifications: { email?: boolean; sms?: boolean; push?: boolean };
    language?: 'ru' | 'en';
    currency?: 'RUB' | 'USD' | 'EUR';
    theme?: 'light' | 'dark' | 'system';
  }>
) => {
  try {
    const safeData: Record<string, any> = {};

    if (updateData.notifications) {
      if (typeof updateData.notifications.email === 'boolean') 
        safeData['notifications.email'] = updateData.notifications.email;
      if (typeof updateData.notifications.sms === 'boolean') 
        safeData['notifications.sms'] = updateData.notifications.sms;
      if (typeof updateData.notifications.push === 'boolean') 
        safeData['notifications.push'] = updateData.notifications.push;
    }
    if (updateData.language) safeData.language = updateData.language;
    if (updateData.currency) safeData.currency = updateData.currency;
    if (updateData.theme) safeData.theme = updateData.theme;

    const updated = await Settings.findOneAndUpdate(
      { user: userId },
      { $set: safeData },
      { 
        new: true, 
        upsert: true, 
        runValidators: true, 
        setDefaultsOnInsert: true,
        lean: true 
      }
    );

    if (!updated) throw new AppError('Не удалось обновить настройки', 500);
    return updated;
  } catch (error: any) {
    console.error('updateUserSettings error:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Ошибка обновления настроек', 500);
  }
};


export const deleteUserSettings = async (userId: string) => {
  try {
    await Settings.findOneAndDelete({ user: userId });
   
    return { message: 'Настройки сброшены' };
  } catch (error) {
    console.error('deleteUserSettings error:', error);
    throw new AppError('Ошибка сброса настроек', 500);
  }
};