import mongoose from "mongoose";
const { Schema, model } = mongoose;

const roleSchema = new Schema({
    name: String
});

export const Roles = model("Roles", roleSchema);