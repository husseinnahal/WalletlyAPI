import SavingGoal from "../models/savingGoal.js";
import asyncHandler from "express-async-handler";
import { v2 as cloudinary } from 'cloudinary';
import axios from 'axios';

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
            { folder: 'savinggoalMoney' },
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

// CRUD saving goals
const addgoal = asyncHandler(async (req, res, next) => {
    const { title, amount,unit } = req.body;
    const userId = req.decoded.id;

    const goalExist = await SavingGoal.findOne({ title: title.trim(), userId });
    if (goalExist) {
        const error = new Error("Goal already exists");
        error.statusCode = 400;
        return next(error);
    }

    let imageUrl ; 
    if (req.file) {
        try {
            const result = await uploadFromBuffer(req.file.buffer);
            imageUrl = result.secure_url; 
        } catch (error) {
            const errors = new Error("Image upload failed");
            errors.statusCode = 500;
            return next(errors);
        }
    }
    let amountInUSD = amount; 
    if (unit !== "USD") {
        try {
            const response = await axios.get(`https://v6.exchangerate-api.com/v6/ba58b0d0ceb524b2f919eac6/latest/USD`);
            const rates = response.data.conversion_rates; 
            if (!rates[unit]) {
                const error = new Error("Invalid currency unit");
                error.statusCode = 400;
                return next(error);
            }

            const rate = rates[unit]; 
            amountInUSD = (amount / rate).toFixed(2);
            amountInUSD = Number(amountInUSD);

        } catch (error) {
            console.error("Error fetching exchange rates:", error.message);
            const errors = new Error("Failed to fetch exchange rates");
            errors.statusCode = 500;
            return next(errors);
        }
    }
    if (amountInUSD<= 0) {
        const error = new Error("The amount is too small");
        error.statusCode = 400;
        return next(error);
    }

    const goal = await SavingGoal.create({
        title: title.trim(),
        amount: amountInUSD,
        image: imageUrl,  
        userId,
    });

    res.status(201).json({
        status: true,
        message: "Goal added successfully",
    });
});

const getGoals = asyncHandler(async (req, res, next) => {

    const userId = req.decoded.id;

    const goals = await SavingGoal.find({ userId },{ "__v": false })
    .sort({ createdAt: -1 }).lean();

    if (!goals.length) {

        const errors = new Error("No Goals found");
        errors.statusCode = 404;
        return next(errors);
    }

    res.status(200).json({
        status: true,
        data: goals,
    });
})

const updateGoals = asyncHandler(async (req, res, next) => {
    const {  title, amount,unit } = req.body;
    const userId = req.decoded.id; 
    let imageUrl;

    const goalfound = await SavingGoal.findById(req.params.id);
    if (!goalfound) {
        const errors = new Error("Goal not found");
        errors.statusCode = 404;
        return next(errors);
    }
    const goalExist = await SavingGoal.findOne({ title: title.trim(),userId,_id: { $ne: req.params.id }});
    if (goalExist) {
        const errors = new Error("Goal already exists");
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

    let amountInUSD = amount;
    if (unit !== "USD") {
        try {
            const response = await axios.get(`https://v6.exchangerate-api.com/v6/ba58b0d0ceb524b2f919eac6/latest/USD`);
            const rates = response.data.conversion_rates;

            if (!rates[unit]) {
                    const error = new Error("Invalid currency unit");
                    error.statusCode = 400;
                    return next(error);
                
            }
            const rate = rates[unit];
            amountInUSD = (amount / rate).toFixed(2);
            amountInUSD = Number(amountInUSD);

        } catch (error) {
            console.error("Error fetching exchange rates:", error.message);
            const errors = new Error("Failed to fetch exchange rates");
            errors.statusCode = 500;
            return next(errors);
        }
    }
    if (amountInUSD<= 0) {
        const error = new Error("The amount is too small");
        error.statusCode = 400;
        return next(error);
    }

    const updatedgoal = await SavingGoal.findByIdAndUpdate(req.params.id,{ 
        title: title.trim(),
        amount:amountInUSD, 
        ...(imageUrl && { image: imageUrl }) },);

    res.status(200).json({
        status: true,
        message: "Goal updated successfully",
    });
});

const deleteGoal = asyncHandler(async (req, res, next) => {
    const userId = req.decoded.id;
    const goal = await SavingGoal.findOneAndDelete({ _id: req.params.id, userId });
  
    if (!goal) {
        const errors = new Error("Goal not found");
        errors.statusCode = 404;
        return next(errors);
    }


    res.status(200).json({
        status: true,
        message: "Goal deleted successfully",
    });
})


// CRUD saving amount
const addSavedAmount = asyncHandler(async (req, res, next) => {
    const { amount, unit } = req.body;
    const userId = req.decoded.id;


    const goal = await SavingGoal.findOne({ _id: req.params.id, userId });
    if (!goal) {
        const error = new Error("Goal not found");
        error.statusCode = 400;
        return next(error);
    }


    let amountInUSD = amount;
    if (unit !== "USD") {
        try {
            const response = await axios.get("https://v6.exchangerate-api.com/v6/ba58b0d0ceb524b2f919eac6/latest/USD");

            if (!response.data || !response.data.conversion_rates) {
                const error = new Error("Invalid response from exchange rate API");
                error.statusCode = 500;
                return next(error);
            }

            const rates = response.data.conversion_rates;
            if (!rates[unit]) {
                const error = new Error("Invalid currency unit");
                error.statusCode = 400;
                return next(error);
            }

            amountInUSD = Number((amount / rates[unit]).toFixed(2));
        } catch (error) {
            return next(new Error("Failed to fetch exchange rates", { statusCode: 500 }));
        }
    }

    if (amountInUSD <= 0) {
        const error = new Error("The amount is too small");
        error.statusCode = 400;
        return next(error);
    }
    
    if (amountInUSD > (goal.amount - goal.total)) {
        const error = new Error("The payment exceeds the remaining amount");
        error.statusCode = 400;
        return next(error);
    }


    goal.savedAmounts.push({ amount: amountInUSD });


    goal.total += amountInUSD;
    await goal.save();

    return res.status(200).json({
        status: true,
        message: "Payment added successfully",
    });
});

const getPayments = asyncHandler(async (req, res, next) => {
    const userId = req.decoded.id;
    const  id = req.params.id;

    const goal = await SavingGoal.findOne({ _id: id, userId });
    if (!goal) {
        const error = new Error("Goal not found");
        error.statusCode = 404;
        return next(error);
    }

    res.status(200).json({
        status: true,
        data:goal.savedAmounts,
        message: "Payments retrieved successfully",
    });
});


const updateSavedAmount = asyncHandler(async (req, res, next) => {
    const { amount, unit } = req.body;
    const userId = req.decoded.id;
    const { id, savedAmountId } = req.params;

    const goal = await SavingGoal.findOne({ _id: id, userId });
    if (!goal) {
        const error = new Error("Goal not found");
        error.statusCode = 404;
        return next(error);
    }

    const savedAmount = goal.savedAmounts.id(savedAmountId);
    if (!savedAmount) {
        const error = new Error("Saved amount not found");
        error.statusCode = 404;
        return next(error);
    }

    let amountInUSD = amount;
    if (unit !== "USD") {
        try {
            const response = await axios.get(`https://v6.exchangerate-api.com/v6/ba58b0d0ceb524b2f919eac6/latest/USD`);
            const rates = response.data.conversion_rates;
            
            if (!rates[unit]) {
                const error = new Error("Invalid currency unit");
                error.statusCode = 400;
                return next(error);
            }

            const rate = rates[unit];
            amountInUSD = parseFloat((amount / rate).toFixed(2)); 
        } catch (error) {
            return next(new Error("Failed to fetch exchange rates", { statusCode: 500 }));
        }
    }

    if (amountInUSD <= 0) {
        const error = new Error("The amount is too small");
        error.statusCode = 400;
        return next(error);
    }

    // Calculate the difference
    const difference = amountInUSD - savedAmount.amount;

    if (goal.total + difference > goal.amount) {
        const error = new Error("The updated payment exceeds the remaining goal amount");
        error.statusCode = 400;
        return next(error);
    }

    savedAmount.amount = amountInUSD;
    goal.total += difference;
    await goal.save();

    res.status(200).json({
        status: true,
        message: "Payment updated successfully",
    });
});


const deleteSavedAmount = asyncHandler(async (req, res, next) => {
    const { id, savedAmountId } = req.params; 
    const userId = req.decoded.id;

    const goal = await SavingGoal.findOne({ _id: id, userId });
    if (!goal) {
        const error = new Error("Goal not found");
        error.statusCode = 404;
        return next(error);
    }

    const savedAmount = goal.savedAmounts.id(savedAmountId);
    if (!savedAmount) {
        const error = new Error("Saved amount not found");
        error.statusCode = 404;
        return next(error);
    }

    // Remove the saved amount 
    goal.savedAmounts.pull(savedAmountId);

    goal.total -= savedAmount.amount;
    await goal.save();

    res.status(200).json({
        status: true,
        message: "Saved amount deleted successfully",

    });
});



export { addgoal ,getGoals,updateGoals,deleteGoal ,addSavedAmount ,updateSavedAmount ,deleteSavedAmount,getPayments};
