import { Request, Response } from 'express';
import { ProductService } from '../../service/productService';

const productService = new ProductService();

export const getProducts = async (req: Request, res: Response) => {
  try {
    const result = await productService.getProducts(req.query as any);
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Error in getProducts:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Internal server error' 
    });
  }
};