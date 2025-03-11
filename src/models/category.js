import mongoose from "mongoose";

// cat schema
const categorySchema = new mongoose.Schema({
    name:{type:String,required:true},
    image:{type:String,required:true},
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
})

const Category = mongoose.model('Category', categorySchema);


export default Category;