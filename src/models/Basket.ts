import { Schema,model } from "mongoose";

const basketSchema=new Schema({
    user:{
        type: Schema.Types.ObjectId, 
        ref:"Users"
    },
    product:{
        type: Schema.Types.ObjectId, 
        ref:"Products"
    },
    count:Number
})
export const Basket = model("Basket",basketSchema)