import mongoose from "mongoose";
const { Schema, model } = mongoose;

const userSchema = new Schema({
  phone: String,
  role: { 
    type: Schema.Types.ObjectId,
    ref: "Roles",
    required: true
  },
  status: { 
    type: String, 
    default: 'active',
    enum: ['active', 'blocked', 'pending', 'deleted']
  },
  mail: {
    type: String,
    lowercase: true,
    trim: true
  }
}, { timestamps: true });

export const Users = model('Users', userSchema);