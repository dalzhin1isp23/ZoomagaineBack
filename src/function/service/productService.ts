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
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 12));
    const skip = (page - 1) * limit;

    const filter: FilterQuery<any> = {};

    if (params.category) {
      const catVal = String(params.category).trim();
      if (mongoose.Types.ObjectId.isValid(catVal)) {
        filter.category = catVal;
      } else {
        try {
          const Category = mongoose.model('Category');
          const cat = await Category.findOne({ name: { $regex: `^${catVal}$`, $options: 'i' } });
          if (cat) filter.category = cat._id;
        } catch {  }
      }
    }

 
    if (params.type) {
      const typeVal = String(params.type).trim();
      if (mongoose.Types.ObjectId.isValid(typeVal)) {
        filter.type = typeVal;
      } else {
        try {
          const Types = mongoose.model('Types');
          const typ = await Types.findOne({ name: { $regex: `^${typeVal}$`, $options: 'i' } });
          if (typ) filter.type = typ._id;
        } catch {  }
      }
    }

    if (params.minPrice || params.maxPrice) {
      filter.price = {};
      if (params.minPrice) filter.price.$gte = Number(params.minPrice);
      if (params.maxPrice) filter.price.$lte = Number(params.maxPrice);
    }

    if (params.inStock === 'true') filter.remains = { $gt: 0 };
    else if (params.inStock === 'false') filter.remains = { $lte: 0 };

    if (params.hasDiscount === 'true') filter.discount = { $gt: 0 };

    if (params.search && String(params.search).trim()) {
      const term = String(params.search).trim();
      filter.$or = [
        { name: { $regex: term, $options: 'i' } },
        { description: { $regex: term, $options: 'i' } }
      ];
    }

    let sortOption: Record<string, 1 | -1> = { _id: -1 };
    const sortStr = String(params.sort).toLowerCase();

    switch (sortStr) {
      case 'price-asc':  sortOption = { price: 1 }; break;
      case 'price-desc': sortOption = { price: -1 }; break;
      case 'newest':     sortOption = { createdAt: -1 }; break;
      case 'popularity': 
      case 'rating':     sortOption = { rating: -1, reviewCount: -1 }; break;
      default:           sortOption = { _id: -1 };
    }

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