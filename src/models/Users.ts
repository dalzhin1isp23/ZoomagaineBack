import { Schema, model } from 'mongoose';

const userSchema = new Schema({
  login: { type: String, required: true },
  password: { type: String, required: true },
  phone: String,
  role: { 
    type: Schema.Types.ObjectId,
    ref:"Role",
    default: 1 },
  status: { type: String, default: 'active' }
});

export const Users = model('Users', userSchema);