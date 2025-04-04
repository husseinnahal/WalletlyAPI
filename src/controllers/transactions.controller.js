import Transactions from '../models/transactions.js';
import Cat from '../models/category.js';
import asyncHandler from "express-async-handler";
import axios from 'axios';
import mongoose from 'mongoose';


const addTransaction = asyncHandler(async (req, res, next) => {
    const { title, amount, unit, type, categoryId } = req.body;
    const userId = req.decoded.id;

    const cat = await Cat.findOne({ _id: categoryId, userId });
    if (!cat) {
        const error = new Error("Category not found.");
        error.statusCode = 404;
        return next(error);
    }
    let amountInUSD = amount; 
    if (unit !== "USD") {
        try {
            const response = await axios.get(`https://open.er-api.com/v6/latest/USD`);
            const rates = response.data.rates; // Get  rates
            // unit like "used lbp eur ..."
            if (!rates[unit]) {
                const error = new Error("Invalid currency unit");
                error.statusCode = 400;
                return next(error);
            }

            
            // Convert amount to USD
            const rate = rates[unit]; 
            amountInUSD = (amount / rate).toFixed(2);



        } catch (error) {
            console.error("Error fetching exchange rates:", error.message);
            const errors = new Error("Failed to fetch exchange rates");
            errors.statusCode = 500;
            return next(errors);
        }
    }
    if (Number(amountInUSD) <= 0) {
        const error = new Error("The amount is too small");
        error.statusCode = 400;
        return next(error);
    }
    const newTransaction = await Transactions.create({
        title: title.trim(),
        amount: amountInUSD,
        type,
        categoryId,
        userId
    });

    res.status(201).json({
        status: true,
        message: "Transaction added successfully",
    });
    
});


const getTransactions = asyncHandler(async (req, res, next) => {
    const { categoryId, type, startDate, endDate, filterBy } = req.query;  
    const userId = req.decoded.id; 

    let filter = { userId }; 

    if (categoryId) filter.categoryId = categoryId;
    if (type) filter.type = type;

    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const firstDayOfYear = new Date(today.getFullYear(), 0, 1);

    // Calculate start of the week (starts on Sunday)
    const firstDayOfWeek = new Date(today);
    firstDayOfWeek.setDate(today.getDate() - today.getDay());

    const startOfToday = new Date(today.setHours(0, 0, 0, 0));

    if (filterBy === "thisMonth") {
        filter.createdAt = { $gte: firstDayOfMonth };
    } else if (filterBy === "thisWeek") {
        filter.createdAt = { $gte: firstDayOfWeek };
    } else if (filterBy === "thisYear") {
        filter.createdAt = { $gte: firstDayOfYear };
    } else if (filterBy === "today") {
        filter.createdAt = { $gte: startOfToday };
    } else if (startDate || endDate) {
        filter.createdAt = {}; 
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    let transactions = await Transactions.find(filter, { "__v": false })
    .populate("categoryId","name image")
    .sort({ createdAt: -1 })
    .lean();

    if (!transactions.length) {

        const errors = new Error("No transactions found");
        errors.statusCode = 404;
        return next(errors);
    }

    // Format createdAt to MM-DD-YYYY
    transactions = transactions.map(transaction => ({
        ...transaction,
        createdAt: new Date(transaction.createdAt).toLocaleDateString("en-US")
    }));

    res.status(200).json({
        status: true,
        data:transactions
    });
});


const editTransaction = asyncHandler(async (req, res, next) => {
    const { title, amount, unit, type, categoryId } = req.body;
    const userId = req.decoded.id;

    const tran = await Transactions.findOne({ _id: req.params.id, userId });
    if (!tran) {
        const error = new Error("Transaction not found.");
        error.statusCode = 404;
        return next(error);
    }

    const cat = await Cat.findOne({ _id: categoryId, userId });
    if (!cat) {
        const error = new Error("Category not found.");
        error.statusCode = 404;
        return next(error);
    }

    let amountInUSD = amount;
    if (unit !== "USD") {
        try {
            const response = await axios.get(`https://open.er-api.com/v6/latest/USD`);
            const rates = response.data.rates;

            if (!rates[unit]) {
                    const error = new Error("Invalid currency unit");
                    error.statusCode = 400;
                    return next(error);
                
            }

            // Convert amount to USD
            const rate = rates[unit];
            amountInUSD = (amount / rate).toFixed(2);

        } catch (error) {
            console.error("Error fetching exchange rates:", error.message);
            const errors = new Error("Failed to fetch exchange rates");
            errors.statusCode = 500;
            return next(errors);
        }
    }
    if (Number(amountInUSD) <= 0) {
        const error = new Error("The amount is too small");
        error.statusCode = 400;
        return next(error);
    }
    await Transactions.findByIdAndUpdate(req.params.id, {
        title: title.trim(),
        amount: amountInUSD,
        type,
        categoryId
    });

    res.status(200).json({
        status: true,
        message: "Transaction updated successfully",
    });

});


const delTransaction = asyncHandler(async (req, res, next) => {
    const userId = req.decoded.id;
    const transaction = await Transactions.findOneAndDelete({ _id: req.params.id, userId });
  
    if (!transaction) {
        const error = new Error("Transaction not found.");
        error.statusCode = 404;
        return next(error);
    }


    res.status(200).json({
        status: true,
        message: "Transaction deleted successfully",
    });
})



// expenses and incomes for bar chart
const getMonthlyStats = asyncHandler(async (req, res, next) => {
    const userId = req.decoded.id;

    const year = req.query.year ? parseInt(req.query.year) : new Date().getFullYear();
    // filtered by the year
    const transactions = await Transactions.find({
        userId,
        createdAt: {
            $gte: new Date(year, 0, 1),
            $lt: new Date(year + 1, 0, 1) 
        }
    });

    let monthlyStats = {};

    transactions.forEach(transaction => {
        const date = new Date(transaction.createdAt); 
        const month = date.getMonth(); // Get month (0 = Jan, 11 = Dec)

        // Initialize the month if not exists
        if (!monthlyStats[month]) {
            monthlyStats[month] = { income: 0, expenses: 0 };
        }

        // Add the transaction amount based on its type
        if (transaction.type === "income") {
            monthlyStats[month].income += transaction.amount;
        } else if (transaction.type === "expense") {
            monthlyStats[month].expenses += transaction.amount;
        }
    });

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const formattedStats = Object.keys(monthlyStats).map(month => ({
        month: monthNames[month],
        income: monthlyStats[month].income.toFixed(2), 
        expenses: monthlyStats[month].expenses.toFixed(2) 
    }));

    res.status(200).json({
        status: true,
        year: year,
        data: formattedStats
    });
});


// get transaction categories
const getTransactionCategories = asyncHandler(async (req, res, next) => {
    const userId = req.decoded.id;
    const { type } = req.query;

    try {
        let matchCriteria = { userId: new mongoose.Types.ObjectId(userId) };

        if (type && ["expense", "income"].includes(type)) {
            matchCriteria.type = type;
        }

        const result = await Transactions.aggregate([
            { $match: matchCriteria },
            {
                $lookup: {
                    from: "categories", // Ensure this matches your collection name exactly
                    localField: "categoryId",
                    foreignField: "_id",
                    as: "categoryDetails",
                }
            },
            { $unwind: { path: "$categoryDetails", preserveNullAndEmptyArrays: true } },
            {
                $group: {
                    _id: "$categoryDetails.name",
                    totalIncome: {
                        $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", 0] }
                    },
                    totalExpense: {
                        $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0] }
                    }
                }
            },
            { $sort: { totalIncome: -1, totalExpense: -1 } }
        ]);

        if (result.length === 0) {
            return res.status(200).json({
                status: true,
                message: "No transactions found for the given criteria"
            });
        }

        res.status(200).json({
            status: true,
            categories: result
        });

    } catch (error) {
        console.error("erorrrrrrr",error);
        next(new Error("Failed to fetch transaction categories breakdown"));
    }
});




export { addTransaction,getTransactions,editTransaction,delTransaction ,getMonthlyStats ,getTransactionCategories };