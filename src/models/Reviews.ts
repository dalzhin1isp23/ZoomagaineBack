import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const reviewSchema = new Schema({
  product: { 
    type: Schema.Types.ObjectId, 
    ref: 'Products', 
    required: true,
    index: true
  },
  user: { 
    type: Schema.Types.ObjectId, 
    ref: 'Users', 
    required: true 
  },
  rating: { 
    type: Number, 
    required: true, 
    min: 1, 
    max: 5 
  },
  title: { 
    type: String, 
    trim: true, 
    maxlength: 100 
  },
  comment: { 
    type: String, 
    required: true, 
    trim: true, 
    maxlength: 2000 
  },
  images: [{
    url: String,
    filename: String
  }],
  isVerified: { 
    type: Boolean, 
    default: true  
  },
  isApproved: { 
    type: Boolean, 
    default: true  
  },
  adminNote: { 
    type: String, 
    trim: true 
  },
  helpfulCount: { 
    type: Number, 
    default: 0 
  },
  reported: { 
    type: Boolean, 
    default: false 
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

reviewSchema.virtual('userName').get(function(this: any) {
  return this.user?.login || 'Пользователь';
});

reviewSchema.index({ product: 1, isApproved: 1, createdAt: -1 });
reviewSchema.index({ user: 1 });

export const Reviews = model('Reviews', reviewSchema);