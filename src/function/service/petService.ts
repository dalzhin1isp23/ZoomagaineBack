import { Pet } from '../../models/Pets';
import AppError from '../../utils/AppError';
import mongoose from 'mongoose';

export const getPetsByOwnerId = async (ownerId: string) => {
  if (!mongoose.Types.ObjectId.isValid(ownerId)) {
    throw new AppError('Неверный ID пользователя', 400);
  }
  return Pet.find({ owner: ownerId }).sort({ createdAt: -1 });
};

export const createPetService = async (
  ownerId: string, 
  data: { name: string; animal: string; bornDate: Date; gender: string; photoUrl: string; breed: string; tags?: string[] }
) => {
  const pet = new Pet({ ...data, owner: ownerId });
  return pet.save();
};

export const updatePetService = async (petId: string, userId: string, updateData: any) => {
  if (!mongoose.Types.ObjectId.isValid(petId)) throw new AppError('Неверный ID питомца', 400);


  const pet = await Pet.findOne({ _id: petId, owner: userId });
  if (!pet) throw new AppError('Питомец не найден или у вас нет прав', 404);


  const allowedUpdates = ['name', 'animal', 'bornDate', 'gender', 'breed', 'photoUrl', 'tags', 'folderColor'];
  Object.keys(updateData).forEach(key => {
    if (allowedUpdates.includes(key)) pet.set(key, updateData[key]);
  });

  return pet.save();
};

export const addToPetWishlistService = async (petId: string, userId: string, productId: string, reason?: string) => {
  if (!mongoose.Types.ObjectId.isValid(petId)) throw new AppError('Неверный ID питомца', 400);
  if (!mongoose.Types.ObjectId.isValid(productId)) throw new AppError('Неверный ID товара', 400);

  const pet = await Pet.findOne({ _id: petId, owner: userId });
  if (!pet) throw new AppError('Питомец не найден', 404);

  const exists = pet.personalWishlist?.some(w => w.product.toString() === productId);
  if (!exists) {
    pet.personalWishlist.push({ product: productId, reason });
    return pet.save();
  }
  return pet;
};

export const uploadPhotoService = async (petId: string, userId: string, fileUrl: string) => {
  if (!mongoose.Types.ObjectId.isValid(petId)) throw new AppError('Неверный ID питомца', 400);
  const pet = await Pet.findOneAndUpdate(
    { _id: petId, owner: userId },
    { photoUrl: fileUrl },
    { new: true }
  );
  if (!pet) throw new AppError('Питомец не найден', 404);
  return pet;
};

export const uploadDocumentService = async (petId: string, userId: string, fileUrl: string, title: string, fileType?: string) => {
  if (!mongoose.Types.ObjectId.isValid(petId)) throw new AppError('Неверный ID питомца', 400);
  const pet = await Pet.findOneAndUpdate(
    { _id: petId, owner: userId },
    { $push: { documents: { title, fileUrl, fileType, uploadedAt: new Date(), isVerified: false } } },
    { new: true }
  );
  if (!pet) throw new AppError('Питомец не найден', 404);
  return pet;
};