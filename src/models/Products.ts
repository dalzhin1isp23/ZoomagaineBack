import { Schema, model } from 'mongoose';
const productSchema = new Schema({
  name: { type: String, required: true },
  description: String,
  manufacturer: String,
  price: Number,
  discription: String,
  type: { type: Schema.Types.ObjectId, ref: 'Types' },
  remains:Number,
  discount:Number,
  images: [{
    url: String,
    isMain: { type: Boolean, default: false }, 
    altText: String
}],
  category: { type: Schema.Types.ObjectId, ref: 'Category' }
});
export const Products = model('Products', productSchema);