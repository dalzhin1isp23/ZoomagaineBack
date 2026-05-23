import { Request, Response, NextFunction } from 'express';
import { query, body, validationResult } from 'express-validator';
import * as reviewService from '../../service/reviuwService';
import AppError from '../../../utils/AppError';

export const createReviewValidation = [
  body('productId').trim().notEmpty().withMessage('ID товара обязателен'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Рейтинг от 1 до 5'),
  body('comment').trim().isLength({ min: 10, max: 2000 }).withMessage('От 10 до 2000 символов'),
  body('title').optional().trim().isLength({ max: 100 }),
  body('images').optional().isArray()
];

export const getReviewsValidation = [
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit: 1-100'),
  query('sortBy').optional().isIn(['newest', 'oldest', 'rating', 'helpful'])
];

export const updateReviewValidation = [
  body('rating').optional().isInt({ min: 1, max: 5 }),
  body('comment').optional().trim().isLength({ min: 10, max: 2000 }),
  body('title').optional().trim().isLength({ max: 100 })
];

export const createReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new AppError(errors.array()[0].msg, 400);

    const userId = req.user?._id?.toString();
    if (!userId) throw new AppError('Требуется авторизация', 401);

    const { productId, rating, title, comment, images } = req.body;

    const review = await reviewService.createReview({
      productId,
      userId,
      rating: Number(rating),
      title: title?.trim(),
      comment: comment.trim(),
      images: images || []
    });

    res.status(201).json({
      status: 'success',
      message: 'Отзыв опубликован',
      data: review
    });
  } catch (err) {
    next(err);
  }
};

export const getReviews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new AppError(errors.array()[0].msg, 400);

    const { productId } = req.params;

    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 0; 
    const sortBy = req.query.sortBy as 'newest' | 'oldest' | 'rating' | 'helpful' | undefined;

    if (req.query.limit && (isNaN(limit) || limit < 1)) {
      throw new AppError('Неверный limit', 400);
    }

    const result = await reviewService.getReviewsByProduct(productId, {
      limit: limit || undefined, 
      sortBy
    });

    res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (err) {
    next(err);
  }
};

export const updateReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new AppError(errors.array()[0].msg, 400);

    const { reviewId } = req.params;
    const userId = req.user?._id?.toString();
    
    if (!userId) throw new AppError('Требуется авторизация', 401);

    const { rating, title, comment, images } = req.body;

    const updated = await reviewService.updateReview(
      reviewId,
      userId,
      {
        rating: rating ? Number(rating) : undefined,
        title: title?.trim(),
        comment: comment?.trim(),
        images
      }
    );

    res.status(200).json({
      status: 'success',
      message: 'Отзыв обновлён',
      data: updated
    });
  } catch (err) {
    next(err);
  }
};

export const deleteReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user?._id?.toString();
    
    if (!userId) throw new AppError('Требуется авторизация', 401);

    await reviewService.deleteReview(reviewId, userId);

    res.status(200).json({
      status: 'success',
      message: 'Отзыв удалён'
    });
  } catch (err) {
    next(err);
  }
};

export const markHelpful = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user?._id?.toString();
    
    if (!userId) throw new AppError('Требуется авторизация', 401);

    const review = await reviewService.markReviewHelpful(reviewId, userId);

    res.status(200).json({
      status: 'success',
      data: { helpfulCount: review.helpfulCount }
    });
  } catch (err) {
    next(err);
  }
};