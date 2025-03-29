import mongoose from "mongoose";

const transactionsSchema=new mongoose.Schema({
    title:{
        type:String,
        required:true
    },
    amount:{
        type:Number,
        required:true
    },
    type:{
        type:String,
        enum:["expense","income"],
        required:true
    },
    categoryId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "categories",
        required:true
    },
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required:true
    }

},{timestamps: true})

const Transactions=mongoose.model("Transactions",transactionsSchema);
export default Transactions;