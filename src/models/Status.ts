import { Schema,model,models } from "mongoose";
const statusSchema = new Schema({
    name:String
})
export const Status=model('Status',statusSchema);