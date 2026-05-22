import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import AppError from '../../utils/AppError';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PRODUCT_UPLOAD_DIR = path.join(__dirname, '../../../uploads/products');
const PET_UPLOAD_DIR = path.join(__dirname, '../../../uploads/pets');

if (!fs.existsSync(PRODUCT_UPLOAD_DIR)) fs.mkdirSync(PRODUCT_UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(PET_UPLOAD_DIR)) fs.mkdirSync(PET_UPLOAD_DIR, { recursive: true });

const productStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, PRODUCT_UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const petStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, PET_UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

export const productUpload = multer({ 
  storage: productStorage, 
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    cb(null, allowed.includes(file.mimetype) ? true : new AppError('Неподдерживаемый формат файла. Разрешены только изображения', 400));
  }
});

export const productMultipleUpload = multer({ 
  storage: productStorage, 
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    cb(null, allowed.includes(file.mimetype) ? true : new AppError('Неподдерживаемый формат файла. Разрешены только изображения', 400));
  }
});

export const petUpload = multer({ 
  storage: petStorage, 
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    cb(null, allowed.includes(file.mimetype) ? true : new AppError('Неподдерживаемый формат файла', 400));
  }
});

const USER_UPLOAD_DIR = path.join(__dirname, '../../../uploads/avatars');

if (!fs.existsSync(USER_UPLOAD_DIR)) fs.mkdirSync(USER_UPLOAD_DIR, { recursive: true });

const userStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, USER_UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const uniqueName = `avatar-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

export const userAvatarUpload = multer({ 
  storage: userStorage, 
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    cb(null, allowed.includes(file.mimetype) ? true : new AppError('Неподдерживаемый формат. Разрешены только изображения', 400));
  }
});

const vetDocStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.join(__dirname, '../../../uploads/orders/vet-docs');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const uniqueName = `vet-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

export const vetDocUpload = multer({ 
  storage: vetDocStorage, 
  limits: { fileSize: 5 * 1024 * 1024 }, 
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError('Разрешены только изображения (JPG, PNG, WebP)', 400));
    }
  }
});

