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
    quantity: Number
  }],
  count: Number,
  sum: Number,
  payed: { type: Boolean, default: false },
  dateArrivedPoint: String,
  dateSending: String,
  dateFinal: String,
  adressPoint: String,
  status: {
    type: Schema.Types.ObjectId,
    ref: "Status"
  },
});

export const Orders = model("Orders", orderSchema);