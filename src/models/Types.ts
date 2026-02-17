import { Schema, model } from 'mongoose';

const typesSchema = new Schema({
    name:String
}) 
export const Types= model('Types',typesSchema);