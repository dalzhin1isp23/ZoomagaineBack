import mongoose from "mongoose";
const { Schema, model } = mongoose;

const authorithationSchema = new Schema({
  login: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true 
  },
  password: { 
    type: String, 
    required: true,
    select: false 
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "Users",
    required: true
  },
  isVerified: { type: Boolean, default: false },
  lastLogin: Date,
  failedAttempts: { type: Number, default: 0 }
}, { timestamps: true });

export const Authorithation = model("Authorithation", authorithationSchema);