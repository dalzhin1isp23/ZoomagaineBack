import express from 'express';
import {
  register,
  login,
  getMe,
  assignRole,
  registerValidation,
  loginValidation
} from '../function/controller/profile/authController';
import { protect, requireAdmin } from '../function/middleware/middleware';
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



export default router;