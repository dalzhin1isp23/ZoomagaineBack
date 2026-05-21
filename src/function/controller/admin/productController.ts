import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AdminProductService, CreateProductData, UpdateProductData } from '../../service/adminProductService';
import { productMultipleUpload } from '../../middleware/upload';

const adminProductService = new AdminProductService();

export const getAdminProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await adminProductService.getAllProducts(req.query);
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('[Admin] getAdminProducts error:', error);
    next(error);
  }
};

export const getAdminProductById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const product = await adminProductService.getProductById(id);
    res.json({ success: true, data: product });
  } catch (error: any) {
    console.error('[Admin] getAdminProductById error:', error);
    next(error);
  }
};

export const createAdminProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body || {};
    
    console.log('[Admin] createProduct body:', body);
    console.log('[Admin] createProduct files:', req.files);
    
    const name = body.name?.toString().trim();
    if (!name) {
      return res.status(400).json({ success: false, message: 'Название товара обязательно' });
    }

    const price = Number(body.price);
    if (isNaN(price) || price < 0) {
      return res.status(400).json({ success: false, message: 'Некорректная цена' });
    }

    const productData: CreateProductData = {
      name,
      description: body.description?.toString().trim(),
      manufacturer: body.manufacturer?.toString().trim(),
      price,
      remains: Number(body.remains) || 0,
      discount: Number(body.discount) || 0,
      images: []
    };

    if (body.category && mongoose.Types.ObjectId.isValid(body.category)) {
      productData.category = body.category;
    }
    if (body.type && mongoose.Types.ObjectId.isValid(body.type)) {
      productData.type = body.type;
    }

    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      productData.images = (req.files as any[]).map((file, index) => ({
        url: `/uploads/products/${file.filename}`,
        isMain: index === 0,
        altText: name
      }));
    }

    const product = await adminProductService.createProduct(productData);
    res.status(201).json({ success: true, data: product });
  } catch (error: any) {
    console.error('[Admin] createAdminProduct error:', error);
    next(error);
  }
};

export const updateAdminProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const body = req.body || {};
    const updateData: UpdateProductData = {};

    if (body.name !== undefined) updateData.name = body.name.toString().trim();
    if (body.description !== undefined) updateData.description = body.description?.toString().trim();
    if (body.manufacturer !== undefined) updateData.manufacturer = body.manufacturer?.toString().trim();
    
    if (body.price !== undefined) {
      const price = Number(body.price);
      if (!isNaN(price) && price >= 0) updateData.price = price;
    }
    if (body.remains !== undefined) {
      const remains = Number(body.remains);
      if (!isNaN(remains) && remains >= 0) updateData.remains = remains;
    }
    if (body.discount !== undefined) {
      const discount = Number(body.discount);
      if (!isNaN(discount) && discount >= 0 && discount <= 100) updateData.discount = discount;
    }

    if (body.category !== undefined) {
      if (!body.category || mongoose.Types.ObjectId.isValid(body.category)) {
        updateData.category = body.category || null;
      }
    }
    if (body.type !== undefined) {
      if (!body.type || mongoose.Types.ObjectId.isValid(body.type)) {
        updateData.type = body.type || null;
      }
    }

    const product = await adminProductService.updateProduct(id, updateData);
    res.json({ success: true, data: product });
  } catch (error: any) {
    console.error('[Admin] updateAdminProduct error:', error);
    next(error);
  }
};

export const deleteAdminProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await adminProductService.deleteProduct(id);
    res.json({ success: true, message: 'Товар удален' });
  } catch (error: any) {
    console.error('[Admin] deleteAdminProduct error:', error);
    next(error);
  }
};

export const uploadProductImages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const body = req.body || {};
    const isMain = body.isMain === 'true';

    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'Файлы не загружены' });
    }

    const imageUrls = (req.files as any[]).map(file => `/uploads/products/${file.filename}`);

    const product = await adminProductService.getProductByIdRaw(id);
    
    if (isMain) {
      product.images.forEach((img: any) => img.isMain = false);
    }

    imageUrls.forEach((url, index) => {
      product.images.push({
        url,
        isMain: isMain && index === 0,
        altText: product.name
      });
    });

    product.updatedAt = new Date();
    await product.save();

    const updatedProduct = await product.populate(['category', 'type']);
    res.json({ success: true, data: updatedProduct });
  } catch (error: any) {
    console.error('[Admin] uploadProductImages error:', error);
    next(error);
  }
};

export const removeProductImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const body = req.body || {};
    const { imageUrl } = body;

    if (!imageUrl) {
      return res.status(400).json({ success: false, message: 'URL изображения не указан' });
    }

    const product = await adminProductService.getProductByIdRaw(id);
    
    product.images = product.images.filter((img: any) => img.url !== imageUrl);
    product.updatedAt = new Date();
    await product.save();

    const updatedProduct = await product.populate(['category', 'type']);
    res.json({ success: true, data: updatedProduct });
  } catch (error: any) {
    console.error('[Admin] removeProductImage error:', error);
    next(error);
  }
};

export const setMainImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const body = req.body || {};
    const { imageUrl } = body;

    if (!imageUrl) {
      return res.status(400).json({ success: false, message: 'URL изображения не указан' });
    }


    const product = await adminProductService.getProductByIdRaw(id);
    
    product.images.forEach((img: any) => {
      img.isMain = img.url === imageUrl;
    });

    product.updatedAt = new Date();
    await product.save();

    const updatedProduct = await product.populate(['category', 'type']);
    res.json({ success: true, data: updatedProduct });
  } catch (error: any) {
    console.error('[Admin] setMainImage error:', error);
    next(error);
  }
};