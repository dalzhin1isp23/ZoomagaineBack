import mongoose from 'mongoose';
import { Products } from '../../models/Products.js';

export interface CreateProductData {
  name: string;
  description?: string;
  manufacturer?: string;
  price: number;
  type?: string | null;
  remains?: number;
  discount?: number;
  category?: string | null;
  images?: Array<{ url: string; isMain?: boolean; altText?: string }>;
}

export interface UpdateProductData extends Partial<CreateProductData> {}

export class AdminProductService {
  async getAllProducts(query: any) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter: any = {};

    if (query.search) {
      filter.name = { $regex: String(query.search), $options: 'i' };
    }

    if (query.category && mongoose.Types.ObjectId.isValid(query.category)) {
      filter.category = query.category;
    }

    if (query.type && mongoose.Types.ObjectId.isValid(query.type)) {
      filter.type = query.type;
    }

    if (query.status === 'low') {
      filter.remains = { $lte: 5, $gt: 0 };
    } else if (query.status === 'out') {
      filter.remains = 0;
    } else if (query.status === 'active') {
      filter.remains = { $gt: 5 };
    }

    const [products, total] = await Promise.all([
      Products.find(filter)
        .skip(skip)
        .limit(limit)
        .populate('category', 'name')
        .populate('type', 'name')
        .sort('-createdAt')
        .lean(),
      Products.countDocuments(filter)
    ]);

    return {
      products,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }


  async getProductById(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const err: any = new Error('Некорректный формат ID товара');
      err.statusCode = 400;
      throw err;
    }

    const product = await Products.findById(id)
      .populate('category', 'name')
      .populate('type', 'name')
      .lean();

    if (!product) {
      const err: any = new Error('Товар не найден');
      err.statusCode = 404;
      throw err;
    }

    return product;
  }

  async getProductByIdRaw(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const err: any = new Error('Некорректный формат ID товара');
      err.statusCode = 400;
      throw err;
    }

    const product = await Products.findById(id)
      .populate('category', 'name')
      .populate('type', 'name');

    if (!product) {
      const err: any = new Error('Товар не найден');
      err.statusCode = 404;
      throw err;
    }

    return product;
  }

  async createProduct(data: CreateProductData) {
    const product = new Products({
      ...data,
      category: data.category || null,
      type: data.type || null,
      images: data.images || [],
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await product.save();
    return product.populate(['category', 'type']);
  }

  async updateProduct(id: string, data: UpdateProductData) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const err: any = new Error('Некорректный формат ID товара');
      err.statusCode = 400;
      throw err;
    }

    const updatePayload: any = { updatedAt: new Date() };
    
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        if ((key === 'category' || key === 'type') && value && !mongoose.Types.ObjectId.isValid(value as string)) {
          continue;
        }
        updatePayload[key] = value;
      }
    }

    const product = await Products.findByIdAndUpdate(
      id,
      updatePayload,
      { new: true, runValidators: true }
    )
      .populate('category', 'name')
      .populate('type', 'name');

    if (!product) {
      const err: any = new Error('Товар не найден');
      err.statusCode = 404;
      throw err;
    }

    return product;
  }

  async deleteProduct(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const err: any = new Error('Некорректный формат ID товара');
      err.statusCode = 400;
      throw err;
    }

    const product = await Products.findByIdAndDelete(id);

    if (!product) {
      const err: any = new Error('Товар не найден');
      err.statusCode = 404;
      throw err;
    }

    return { success: true };
  }

  async uploadProductImage(productId: string, imageUrl: string, isMain: boolean = false) {
    const product = await Products.findById(productId);
    
    if (!product) {
      const err: any = new Error('Товар не найден');
      err.statusCode = 404;
      throw err;
    }

    if (isMain) {
      product.images.forEach((img: any) => img.isMain = false);
    }

    product.images.push({
      url: imageUrl,
      isMain,
      altText: product.name
    });

    product.updatedAt = new Date();
    await product.save();

    return product.populate(['category', 'type']);
  }

  async removeProductImage(productId: string, imageUrl: string) {
    const product = await Products.findById(productId);
    
    if (!product) {
      const err: any = new Error('Товар не найден');
      err.statusCode = 404;
      throw err;
    }

    product.images = product.images.filter((img: any) => img.url !== imageUrl);
    product.updatedAt = new Date();
    await product.save();

    return product;
  }
}