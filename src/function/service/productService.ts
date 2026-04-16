import mongoose from 'mongoose';
import type { FilterQuery } from 'mongoose';
import { Products } from '../../models/Products.js';

export interface ProductQueryParams {
  page?: string | number;
  limit?: string | number;
  category?: string;
  type?: string;
  minPrice?: string | number;
  maxPrice?: string | number;
  inStock?: string;
  hasDiscount?: string;
  search?: string;
  sort?: string;
}

export class ProductService {
  async getProducts(params: ProductQueryParams) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 9));
    const skip = (page - 1) * limit;

    const filter: FilterQuery<any> = {};

    if (params.category) {
      if (mongoose.Types.ObjectId.isValid(String(params.category))) {
        filter.category = params.category;
      } else {
        const Category = mongoose.model('Category');
        const cat = await Category.findOne({ name: new RegExp(String(params.category), 'i') });
        if (cat) filter.category = cat._id;
      }
    }

    if (params.type) {
      if (mongoose.Types.ObjectId.isValid(String(params.type))) {
        filter.type = params.type;
      } else {
        const Types = mongoose.model('Types');
        const typ = await Types.findOne({ name: new RegExp(String(params.type), 'i') });
        if (typ) filter.type = typ._id;
      }
    }

    if (params.minPrice || params.maxPrice) {
      filter.price = {};
      if (params.minPrice) filter.price.$gte = Number(params.minPrice);
      if (params.maxPrice) filter.price.$lte = Number(params.maxPrice);
    }

    if (params.inStock === 'true') filter.remains = { $gt: 0 };
    if (params.hasDiscount === 'true') filter.discount = { $gt: 0 };

    if (params.search) {
      filter.name = { $regex: String(params.search), $options: 'i' };
    }

    const sortMap: Record<string, string> = {
      'price': 'price',
      '-price': '-price',
      '-createdAt': '-_id',
      'name': 'name',
      '-name': '-name',
      'newest': '-_id',
      'popularity': '-_id',
    };
    const sortOption = sortMap[String(params.sort)] || '-_id';

    const [products, total] = await Promise.all([
      Products.find(filter)
        .skip(skip)
        .limit(limit)
        .populate('category', 'name')
        .populate('type', 'name')
        .sort(sortOption)
        .lean(),
      Products.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
       products,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
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
}