import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import * as userService from '../../service/profileService';
import AppError from '../../../utils/AppError';

export const addPetValidation = [
  body('name').trim().notEmpty().withMessage('Вы забыли Имя'),
  body('animal').trim().notEmpty().withMessage('Вы забыли Вид животного'),
  body('bornDate').optional().isISO8601().withMessage('Неверный формат даты рождения'),
  body('gender').isIn(['Мальчик', 'Девочка']).withMessage('Неверный пол питомца'),
  body('photoUrl').optional().trim(),
  body('breed').optional().trim(),
  body('tags').optional().isArray().withMessage('Теги должны быть массивом'),
  body('folderColor').optional().isIn(['#234cd3','#059669','#7c3aed','#dc2626','#d97706','#cacc3b','#f163d9','#15a0a5'])
];

export const updatePetValidation = [
  body('name').optional().trim().notEmpty(),
  body('photoUrl').optional().trim(),
  body('folderColor').optional().isIn(['#234cd3','#059669','#7c3aed','#dc2626','#d97706','#cacc3b','#f163d9','#15a0a5']),
  body('bornDate').optional().isISO8601(),
  body('animal').optional().isIn(["Собака","Кот","Птица","Грызун","Пресмыкающееся","Рыба","Другое"]),
  body('gender').optional().isIn(["Мальчик","Девочка"]),
  body('breed').optional().trim(),
  body('tags').optional().isArray(),
  body('documents').optional().isArray()
];

export const addToPetWishlistValidation = [
  body('productId').trim().notEmpty().withMessage('Необходимо указать ID товара'),
  body('reason').optional().trim()
];

export const createPet = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new AppError(errors.array()[0].msg, 400);
    
    const userId = req.user?._id?.toString();
    if (!userId) throw new AppError('Требуется авторизация', 401);

    const { name, animal, bornDate, gender, photoUrl, breed, tags, folderColor } = req.body;
    
    const pet = await userService.petAdd(
      userId,
      name,
      animal,
      bornDate ? new Date(bornDate) : undefined,
      gender,
      photoUrl,
      breed,
      tags || [],
      folderColor
    );
    
    res.status(201).json({ status: 'success', message: 'Питомец успешно добавлен', data: pet });
  } catch (err) { 
    console.error('createPet error:', err);
    next(err); 
  }
};

export const updatePet = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new AppError(errors.array()[0].msg, 400);
    const { petId } = req.params;
    const updated = await userService.updateProfilePet(petId, req.body);
    res.status(200).json({ status: 'success', message: 'Профиль питомца обновлен', data: updated });
  } catch (err) { next(err); }
};

export const addToPetWishlist = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new AppError(errors.array()[0].msg, 400);
    const { petId } = req.params;
    const { productId, reason } = req.body;
    const pet = await userService.favAddPet(petId, productId, reason);
    res.status(200).json({ status: 'success', message: 'Товар добавлен в избранное питомца', data: pet });
  } catch (err) { next(err); }
};

export const getPets = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id?.toString();
    if (!userId) throw new AppError('Требуется авторизация', 401);
    const pets = await userService.getPets(userId);
    res.status(200).json({ status: 'success', message: 'Питомцы успешно загружены', data: pets });
  } catch (err) { next(err); }
};

export const uploadPetPhoto = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id?.toString();
    if (!userId) throw new AppError('Требуется авторизация', 401);
    if (!req.file) throw new AppError('Файл не загружен', 400);
    const fileUrl = `/uploads/pets/${req.file.filename}`;
    const pet = await userService.uploadPhotoService(req.params.petId, userId, fileUrl);
    res.status(200).json({ status: 'success', message: 'Фото обновлено', data: pet });
  } catch (err) { next(err); }
};

export const uploadDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id?.toString();
    if (!userId) throw new AppError('Требуется авторизация', 401);
    if (!req.file) throw new AppError('Файл не загружен', 400);
    const title = req.body.title || 'Документ';
    const fileUrl = `/uploads/pets/${req.file.filename}`;
    const fileType = req.file.mimetype.split('/')[1];
    const pet = await userService.uploadDocumentService(req.params.petId, userId, fileUrl, title, fileType);
    res.status(201).json({ status: 'success', message: 'Документ добавлен', data: pet });
  } catch (err) { next(err); }
};