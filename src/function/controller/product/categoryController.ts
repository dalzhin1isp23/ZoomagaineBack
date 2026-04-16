import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

export const getCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const Category = mongoose.model('Category');
    const categories = await Category.find().select('name').lean();

    res.json({
      success: true,
      data: categories,
    });
  } catch (error: any) {
    next(error);
  }
};