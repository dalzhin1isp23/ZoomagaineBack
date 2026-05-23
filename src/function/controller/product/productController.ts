import { Request, Response, NextFunction } from 'express';
import { ProductService } from '../../service/productService';

const productService = new ProductService();


export const getProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await productService.getProducts(req.query as any);
    res.json({ success: true, ...result });
  } catch (error: any) {

    next(error);
  }
};