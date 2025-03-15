import User from "../models/users.js";
import createToken from "../utils/createToken.js";
import asyncHandler from "express-async-handler";
import bcrypt from "bcrypt";
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});    

const uploadFromBuffer = (buffer) =>
    new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: 'userWalletly' },
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



const registration = asyncHandler(async (req, res, next) => {
    const { username, email, password } = req.body;


    const emailExist = await User.findOne({ email });
    if (emailExist) {
        const error = new Error("Email already exists");
        error.statusCode = 400;
        return next(error);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
        username: username.trim(),
        email: email.trim(),
        password: hashedPassword,
    });

    const token = createToken(newUser._id);

    res.status(201).json({
        status: true,
        message: "Registration successful",
        token,
    });
});


const MAX_FAILED_ATTEMPTS = 3;
const LOCK_TIME = 30 * 60 * 1000; // 30 minutes
const login = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email.trim() || !password.trim()) {
        const error = new Error("All fields are required");
        error.statusCode = 400;
        return next(error);
    }

    const user = await User.findOne({ email });
    if (!user) {
        const error = new Error("Invalid credentials");
        error.statusCode = 400;
        return next(error);
    }

    if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS && user.lockUntil > Date.now()) {
        const error = new Error("Too many failed. Try again later.");
        error.statusCode = 403;
        return next(error);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        user.failedLoginAttempts += 1;
        if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
            user.lockUntil = Date.now() + LOCK_TIME;
        }
        await user.save();

        const error = new Error("Invalid credentials");
        error.statusCode = 400;
        return next(error);
    }

    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    const token = createToken(user._id);

    res.status(200).json({
        status: true,
        message: "Login successful",
        token
    });
});



const editUser = asyncHandler(async (req, res, next) => {
    const { username, email } = req.body;
    const userId = req.decoded.id;
    let imageUrl;


    const emailExist = await User.findOne({ email,_id: { $ne: userId } });
    if (emailExist) {
        const error = new Error("Email already exists");
        error.statusCode = 400;
        return next(error);
    }

    if (req.file) {
        try {
            const result = await uploadFromBuffer(req.file.buffer);
            imageUrl = result.secure_url;
        } catch (error) {
            return res.status(500).json({ status: false, message: "Image upload failed", error: error.message });
        }
    }

    const updatedUser = await User.findByIdAndUpdate(
        userId,
        { username, email , ...(imageUrl && { image: imageUrl })},
    );
    if (!updatedUser) {
        const error = new Error("User not found");
        error.statusCode = 404;
        return next(error);
    }

    res.status(200).json({
        status: true,
        message: "User updated successfully",
        updatedUser
    });
});


const updatePassword = asyncHandler(async (req, res, next) => {
    const { oldPassword, newPassword } = req.body;
    const userId = req.decoded.id;
    
    const user = await User.findById(userId);
    if (!user) {
        const error = new Error("User not found");
        error.statusCode = 404;
        return next(error);
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
        const error = new Error("Old password is incorrect");
        error.statusCode = 400;
        return next(error);
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    await user.save();

    res.status(200).json({
        status: true,
        message: "Password updated successfully",
    });
});

const getuser = asyncHandler(async (req, res, next) => {
    try {
        const userId = req.decoded.id;
        const user = await User.findById(userId).select("-password"); 
        if (!user) {
            const error = new Error("User not found");
            error.statusCode = 404;
            return next(error);
        }

        res.status(200).json({
            status: true,
            message: "User fetched successfully",
            data: user,
        });
    } catch (error) {
        next(new Error("Server error, please try again later"));
    }
});

export { registration,login,editUser,updatePassword,getuser };

