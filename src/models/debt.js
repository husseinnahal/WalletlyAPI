import mongoose from "mongoose";

const DebtSchema=new mongoose.Schema({

    amount:{
        type:Number,
        required:true
    },
    forWhom:{
        type:String,
        required:true
    },
    total:{
        type:Number,
        default:0
    },
    paidDebt:[
        {
            amount: {
              type: Number,
              required: true,
            },
            date: {
              type: Date,
              default: Date.now,
            },
        },
    ],
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required:true
    }

},{timestamps:true})

const Debt=mongoose.model("Debt",DebtSchema);
export default Debt;