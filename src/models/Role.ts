import { Schema, model } from 'mongoose';
const roleScheme=new Schema({
    name:String
})
export const Roles=model("Roles",roleScheme)