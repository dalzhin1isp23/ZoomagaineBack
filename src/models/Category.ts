import mongoose from "mongoose";
const { Schema, model } = mongoose;

const categorySchema = new Schema({
    name: String
});

export const Category = model('Category', categorySchema);