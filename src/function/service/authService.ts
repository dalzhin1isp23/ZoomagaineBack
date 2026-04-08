import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Authorithation } from '../../models/Authorithation';
import { Users } from '../../models/Users';
import { Roles } from '../../models/Roles';
import AppError from '../../utils/AppError';

const ROLE_IDS = {
  ADMIN: '2',
  USER: '1',
  DILEVERY: '3',
  HELPER: '4'
};

export const createJWT = (payload: { authId: string; login: string; userId: string; role?: string }): string => {
  return jwt.sign(
    {
      authId: payload.authId,
      login: payload.login,
      userId: payload.userId,
      role: payload.role
    },
    process.env.JWT_SECRET as string,
    { expiresIn: process.env.JWT_EXPIRE || '1d' }
  );
};

export const register = async (
  login: string,
  password: string,
  mail?: string,
  phone?: string
) => {
  const existingAuth = await Authorithation.findOne({ login });
  if (existingAuth) {
    throw new AppError('Пользователь с таким логином уже существует', 400);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const defaultRole = await Roles.findOne({ name: 'user' });
  if (!defaultRole) {
    throw new AppError('Роль пользователя не найдена', 500);
  }

  const user = await Users.create({
    mail,
    phone,
    role: defaultRole._id,
    status: 'active'
  });

  const auth = await Authorithation.create({
    login,
    password: hashedPassword,
    user: user._id,
    isVerified: true
  });

  const token = createJWT({
    authId: auth._id.toString(),
    login: auth.login,
    userId: user._id.toString(),
    role: user.role?.toString()
  });

  return {
    user: {
      _id: user._id.toString(),
      mail: user.mail,
      phone: user.phone,
      role: user.role?.toString()
    },
    token
  };
};

export const login = async (login: string, password: string) => {
  const auth = await Authorithation.findOne({ login }).select('+password').populate('user');
  
  if (!auth) {
    throw new AppError('Неверный логин или пароль', 401);
  }

  if (!auth.user) {
    throw new AppError('Пользователь не найден', 404);
  }

  if (auth.user.status !== 'active') {
    throw new AppError('Аккаунт заблокирован', 403);
  }

  const isMatch = await bcrypt.compare(password, auth.password);
  if (!isMatch) {
    auth.failedAttempts = (auth.failedAttempts || 0) + 1;
    await auth.save();
    throw new AppError('Неверный логин или пароль', 401);
  }

  auth.failedAttempts = 0;
  auth.lastLogin = new Date();
  await auth.save();

  const token = createJWT({
    authId: auth._id.toString(),
    login: auth.login,
    userId: auth.user._id.toString(),
    role: auth.user.role?.toString()
  });

  return {
    user: {
      _id: auth.user._id.toString(),
      mail: auth.user.mail,
      phone: auth.user.phone,
      role: auth.user.role?.toString(),
      status: auth.user.status
    },
    token
  };
};

export const getUserByToken = async (userId: string) => {
  const user = await Users.findById(userId).populate('role', 'name');
  if (!user) {
    throw new AppError('Пользователь не найден', 404);
  }
  return user;
};

export const isAdmin = async (userId: string): Promise<boolean> => {
  const user = await Users.findById(userId).populate('role');
  if (!user) return false;
  
  const roleId = user.role?._id?.toString() || user.role?.toString();
  return roleId === ROLE_IDS.ADMIN;
};

export const assignRole = async (
  targetUserId: string,
  roleName: string,
  adminUserId: string
) => {
  const isAdminUser = await isAdmin(adminUserId);
  if (!isAdminUser) {
    throw new AppError('Только администратор может назначать роли', 403);
  }

  const role = await Roles.findOne({ name: roleName });
  if (!role) {
    throw new AppError('Роль не найдена', 404);
  }

  const targetUser = await Users.findById(targetUserId);
  if (!targetUser) {
    throw new AppError('Пользователь не найден', 404);
  }

  targetUser.role = role._id;
  await targetUser.save();

  return {
    userId: targetUser._id.toString(),
    role: role.name
  };
};