import mongoose from "mongoose";
const { Schema, model } = mongoose;

const orderSchema = new Schema({
  user: { 
    type: Schema.Types.ObjectId, 
    ref: 'Users', 
    required: true 
  },
  products: [{
    product: { 
      type: Schema.Types.ObjectId, 
      ref: 'Products'  
    },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true },
    name: { type: String, required: true }  
  }],
  sum: { type: Number, required: true },
  

  deliveryMethod: { 
    type: String, 
    enum: ['courier', 'pickup'], 
    default: 'courier' 
  },
  adressPoint: { type: String, required: true },
  city: String,
  

  paymentMethod: { 
    type: String, 
    enum: ['card', 'cash'], 
    default: 'card' 
  },
  

  status: {
    type: Schema.Types.ObjectId,
    ref: "Status",
    default: "6a0d78968c9a243088c4b24b"
  },
  dateArrivedPoint: Date,
  dateSending: Date,
  dateFinal: Date,
  

  hasVetMedicine: { type: Boolean, default: false },
  vetDocuments: [{
    url: String,
    filename: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  

  promoCode: String,
  comment: String,
  
  payed: { type: Boolean, default: false }
}, { timestamps: true });

export const Orders = model("Orders", orderSchema);