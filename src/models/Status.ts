import mongoose from "mongoose";
const { Schema, model } = mongoose;

const statusSchema = new Schema({
    name: String
});

export const Status = model('Status', statusSchema);