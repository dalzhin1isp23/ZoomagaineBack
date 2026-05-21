import mongoose from "mongoose";
const { Schema, model } = mongoose;

const productSchema = new Schema({
  name: { type: String, required: true },
  description: String,
  manufacturer: String,
  price: Number,
  type: { type: Schema.Types.ObjectId, ref: 'Types' },
  remains: Number,
  discount: Number,
  isVetMedicine: { type: Boolean, default: false }, 
  images: [{
    url: String,
    isMain: { type: Boolean, default: false }, 
    altText: String
  }],
  category: { type: Schema.Types.ObjectId, ref: 'Category' }
}, { timestamps: true });

export const Products = model('Products', productSchema);