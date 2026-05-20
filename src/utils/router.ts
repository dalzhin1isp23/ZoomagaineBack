import express from 'express';
import { protect, requireAdmin } from '../function/middleware/middleware';
import { petUpload } from '../function/middleware/upload';

import { register, login, getMe, assignRole, registerValidation, loginValidation } from '../function/controller/profile/authController';
import { toggleFavorite, getFavorites } from "../function/controller/profile/favoritesController";
import { getPets, createPet, updatePet, addToPetWishlist, addPetValidation, updatePetValidation, addToPetWishlistValidation, uploadPetPhoto, uploadDocument } from "../function/controller/profile/petsController";
import { createOrderValidation, createOrder, updateOrderStatusValidation, switchOrderStatus, removeOrder, getOrders } from "../function/controller/profile/ordersController";
import { updateProfileValidation, updateProfile, getProfile, logout } from "../function/controller/profile/profileController";
import { getProducts } from '../function/controller/product/productController';
import { getProductDetails } from '../function/controller/product/productDetailController';
import { getCategories } from '../function/controller/product/categoryController';
import { getTypes } from '../function/controller/product/typeController';

const router = express.Router();

router.post('/auth/register', registerValidation, register);
router.post('/auth/login', loginValidation, login);
router.get('/auth/me', protect, getMe);
router.post('/auth/assign-role', protect, requireAdmin, assignRole);

router.get('/products', getProducts);
router.get('/products/:id', getProductDetails);
router.get('/categories', getCategories);
router.get('/types', getTypes);

router.get('/favorites', protect, getFavorites);
router.post('/favorites/:productId', protect, toggleFavorite);

router.get('/pets', protect, getPets);
router.post('/pets', protect, addPetValidation, createPet);
router.patch('/pets/:petId', protect, updatePetValidation, updatePet);
router.post('/pets/:petId/wishlist', protect, addToPetWishlistValidation, addToPetWishlist);
router.patch('/pets/:petId/photo', protect, petUpload.single('photo'), uploadPetPhoto);
router.post('/pets/:petId/documents', protect, petUpload.single('document'), uploadDocument);

router.get('/orders', protect, getOrders);
router.post('/orders', protect, createOrderValidation, createOrder);
router.patch('/orders/:orderId/status', protect, updateOrderStatusValidation, switchOrderStatus);
router.delete('/orders/:orderId', protect, removeOrder);

router.get('/profile', protect, getProfile);
router.patch('/profile', protect, updateProfileValidation, updateProfile);
router.post('/logout', protect, logout);

export default router;