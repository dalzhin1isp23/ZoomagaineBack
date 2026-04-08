import express from 'express';
import {
  register,
  login,
  getMe,
  assignRole,
  registerValidation,
  loginValidation
} from '../function/controller/authController';
import { protect, requireAdmin } from '../function/middleware/middleware';

const router = express.Router();

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.get('/me', protect, getMe);
router.post('/assign-role', protect, requireAdmin, assignRole);

export default router;