import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

export const getTypes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const Type = mongoose.model('Types');
    const types = await Type.find().select('name').lean();

    res.json({
      success: true,
      data: types,
    });
  } catch (error: any) {
    next(error);
  }
};