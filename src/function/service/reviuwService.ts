import mongoose from 'mongoose';
import AppError from '../../utils/AppError';
import { Reviews } from '../../models/Reviews';
import { Products } from '../../models/Products';

export interface CreateReviewInput {
  productId: string;
  userId: string;
  rating: number;
  title?: string;
  comment: string;
  images?: Array<{ url: string; filename: string }>;
}

export interface UpdateReviewInput {
  rating?: number;
  title?: string;
  comment?: string;
  images?: Array<{ url: string; filename: string }>;
}

const calculateRatingDistribution = (reviews: any[]): { [key: number]: number } => {
  const dist: { [key: number]: number } = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach((r: any) => {
    const rating = Number(r.rating);
    if (dist[rating] !== undefined) {
      dist[rating] = (dist[rating] || 0) + 1;
    }
  });
  return dist;
};

const updateProductReviewStats = async (productId: string): Promise<void> => {
  const stats = await Reviews.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(productId) } }, 
    { 
      $group: { 
        _id: '$product', 
        averageRating: { $avg: '$rating' },
        reviewCount: { $sum: 1 }
      }
    }
  ]);

  const avgRating = stats[0]?.averageRating || 0;
  const reviewCount = stats[0]?.reviewCount || 0;

  await Products.findByIdAndUpdate(productId, {
    rating: parseFloat(avgRating.toFixed(1)),
    reviewCount: Number(reviewCount)
  });
};

export const createReview = async (input: CreateReviewInput) => {
  if (!mongoose.Types.ObjectId.isValid(input.productId)) {
    throw new AppError('Неверный ID товара', 400);
  }
  if (!mongoose.Types.ObjectId.isValid(input.userId)) {
    throw new AppError('Неверный ID пользователя', 400);
  }
  
  const rating = Number(input.rating);
  if (rating < 1 || rating > 5) {
    throw new AppError('Рейтинг должен быть от 1 до 5', 400);
  }

  const existing = await Reviews.findOne({ 
    product: input.productId, 
    user: input.userId 
  });
  
  if (existing) {
    throw new AppError('Вы уже оставляли отзыв на этот товар', 409);
  }

  const review = new Reviews({
    product: input.productId,
    user: input.userId,
    rating: rating,
    title: input.title?.trim() || '',
    comment: input.comment.trim(),
    images: input.images || [],
    isVerified: true,    
    isApproved: true,      
    helpfulCount: 0,
    helpfulVotes: []
  });

  await review.save();
  await updateProductReviewStats(input.productId);

  return review.populate('user', 'login avatar');
};

export const getReviewsByProduct = async (
  productId: string,
  options: { 
    limit?: number;  
    sortBy?: 'newest' | 'oldest' | 'rating' | 'helpful';
  } = {}
) => {
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new AppError('Неверный ID товара', 400);
  }

  const limit = options.limit ? Math.min(100, Math.max(1, Number(options.limit))) : 0;
  const sortBy = options.sortBy || 'newest';

  const queryFilter: any = { product: productId };

  let sortOption: any = { createdAt: -1 };
  switch (sortBy) {
    case 'oldest': sortOption = { createdAt: 1 }; break;
    case 'rating': sortOption = { rating: -1, createdAt: -1 }; break;
    case 'helpful': sortOption = { helpfulCount: -1, createdAt: -1 }; break;
  }

  let reviewsQuery = Reviews.find(queryFilter)
    .populate('user', 'login avatar')
    .sort(sortOption)
    .lean();

  if (limit > 0) {
    const page = 1;
    const skip = (page - 1) * limit;
    reviewsQuery = reviewsQuery.skip(skip).limit(limit);
  }

  const reviews = await reviewsQuery;

  const total = await Reviews.countDocuments(queryFilter);

  const stats = await Reviews.aggregate([
    { $match: { product: productId } }, 
    { 
      $group: { 
        _id: null, 
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      }
    }
  ]);

  const avgRating = stats[0]?.averageRating?.toFixed(1) || '0';
  const distribution = calculateRatingDistribution(reviews);

  return {
    reviews,
    pagination: {
      total,
      page: 1,
      limit: limit || total,
      totalPages: limit > 0 ? Math.ceil(total / limit) : 1
    },
    stats: {
      averageRating: parseFloat(avgRating),
      totalReviews: stats[0]?.totalReviews || 0,
      distribution
    }
  };
};

export const updateReview = async (
  reviewId: string,
  userId: string,
  updates: UpdateReviewInput
) => {
  if (!mongoose.Types.ObjectId.isValid(reviewId)) {
    throw new AppError('Неверный ID отзыва', 400);
  }

  const review = await Reviews.findById(reviewId);
  if (!review) {
    throw new AppError('Отзыв не найден', 404);
  }

  if (review.user.toString() !== userId) {
    throw new AppError('У вас нет прав для редактирования этого отзыва', 403);
  }

  const updateData: any = { updatedAt: new Date() };
  
  if (updates.rating !== undefined) {
    const r = Number(updates.rating);
    if (r >= 1 && r <= 5) updateData.rating = r;
  }
  if (updates.title !== undefined) updateData.title = updates.title.trim();
  if (updates.comment !== undefined) updateData.comment = updates.comment.trim();
  if (updates.images !== undefined) updateData.images = updates.images;

  Object.assign(review, updateData);
  await review.save();
  await updateProductReviewStats(review.product);

  return review.populate('user', 'login avatar');
};


export const deleteReview = async (reviewId: string, userId: string) => {
  if (!mongoose.Types.ObjectId.isValid(reviewId)) {
    throw new AppError('Неверный ID отзыва', 400);
  }

  const review = await Reviews.findById(reviewId);
  if (!review) {
    throw new AppError('Отзыв не найден', 404);
  }

  if (review.user.toString() !== userId) {
    throw new AppError('У вас нет прав для удаления этого отзыва', 403);
  }

  const productId = review.product;
  await Reviews.findByIdAndDelete(reviewId);
  await updateProductReviewStats(productId);

  return { success: true };
};

export const markReviewHelpful = async (reviewId: string, userId: string) => {
  if (!mongoose.Types.ObjectId.isValid(reviewId)) {
    throw new AppError('Неверный ID отзыва', 400);
  }

  const existing = await Reviews.findOne({ 
    _id: reviewId, 
    'helpfulVotes.user': userId 
  });
  
  if (existing) {
    throw new AppError('Вы уже оценивали этот отзыв', 409);
  }

  const review = await Reviews.findByIdAndUpdate(
    reviewId,
    { 
      $inc: { helpfulCount: 1 },
      $push: { helpfulVotes: { user: userId, date: new Date() } }
    },
    { new: true }
  );

  if (!review) throw new AppError('Отзыв не найден', 404);
  return review;
};