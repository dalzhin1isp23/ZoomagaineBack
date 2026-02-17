import { model,Schema } from "mongoose";
const authorithationSchema = new Schema ({
    login:String,
    password:String
})
export const  Authorithation=model("Authorithation",authorithationSchema);