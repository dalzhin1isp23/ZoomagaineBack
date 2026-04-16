import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { ProductService } from '../../service/productService';

const productService = new ProductService();

export const getProductDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Неверный формат ID' });
    }

    const product = await productService.getProductById(id);

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error); 
  }
};