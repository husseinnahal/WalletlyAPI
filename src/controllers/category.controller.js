import Cat from '../models/category.js';
import asyncHandler from "express-async-handler";
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});    


// Function to upload an image to Cloudinary from buffer
const uploadFromBuffer = (buffer) =>
    new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: 'catMoney' },
            (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            }
        );
        stream.end(buffer);
    });

const addcategory = asyncHandler(async (req, res, next) => {
    const { name } = req.body;
    const userId = req.decoded.id;

    // Check if file is uploaded
    if (!req.file) {
        const error = new Error("Image file is required");
        error.statusCode = 400;
        return next(error);
    }

    let imageUrl;
    try {
        // Upload image to Cloudinary
        const result = await uploadFromBuffer(req.file.buffer);
        imageUrl = result.secure_url;
    } catch (error) {
        const errors = new Error("Image upload failed");
        errors.statusCode = 500;
        return next(errors);
    }

    const categoryExist = await Cat.findOne({ name: name.trim(), userId });
    if (categoryExist) {
        const errors = new Error("Category already exists");
        errors.statusCode = 400;
        return next(errors);
    }

    const newCategory = await Cat.create({
        name: name.trim(),
        image: imageUrl,
        userId
    });

    res.status(201).json({
        status: true,
        message: "Category added successfully",
    });
});


const getCategories = asyncHandler(async (req, res, next) => {
    const userId = req.decoded.id;  

    const categories = await Cat.find({ userId }, { __v: 0 }).lean();
    
    if (categories.length===0) {
        const errors = new Error("no Categories Founded");
        errors.statusCode = 404;
        return next(errors);
    }

    res.status(200).json({
        status: true,
        data:categories
    });

})


const editCategory = asyncHandler(async (req, res, next) => {
    const { name } = req.body;
    const userId = req.decoded.id; 
    let imageUrl;

    const catfound = await Cat.findById(req.params.id);
    if (!catfound) {
        const errors = new Error("Category not found");
        errors.statusCode = 404;
        return next(errors);
    }

    const categoryExist = await Cat.findOne({ name: name.trim(), userId, _id: { $ne: req.params.id } });
    if (categoryExist) {
        const errors = new Error("Category already exists");
        errors.statusCode = 400;
        return next(errors);
    }

    if (req.file) {
        try {
            const result = await uploadFromBuffer(req.file.buffer);
            imageUrl = result.secure_url;
        } catch (error) {
            return res.status(500).json({ status: false, message: "Image upload failed", error: error.message });
        }
    }

    const updatedCategory = await Cat.findByIdAndUpdate(req.params.id,{ name: name.trim(), ...(imageUrl && { image: imageUrl }) },);


    res.status(200).json({
        status: true,
        message: "Category updated successfully",
    });
});



export { addcategory,getCategories ,editCategory};