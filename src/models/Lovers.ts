import { Schema,model } from "mongoose";

const loversSchema=new Schema({
    user:{
        type: Schema.Types.ObjectId, 
        ref:"Users"
    },
    product:{
        type: Schema.Types.ObjectId, 
        ref:"Products"
    }
})
export const Lovers = model("Lovers",loversSchema)