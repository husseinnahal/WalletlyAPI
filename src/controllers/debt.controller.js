import Debt from "../models/debt.js";
import asyncHandler from "express-async-handler";
import axios from 'axios';


// CRUD debt
const addDebt = asyncHandler(async (req, res, next) => {
    const { amount,forWhom,unit } = req.body;
    const userId = req.decoded.id;

    const debtExist = await Debt.findOne({ forWhom: forWhom.trim(), userId });
    if (debtExist) {
        const error = new Error("debt already exists");
        error.statusCode = 400;
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

            const rate = rates[unit]; 
            amountInUSD = (amount / rate).toFixed(2);


        } catch (error) {
            console.error("Error fetching exchange rates:", error.message);
            const errors = new Error("Failed to fetch exchange rates");
            errors.statusCode = 500;
            return next(errors);
        }
    }

    const debt = await Debt.create({
        amount: amountInUSD,
        forWhom: forWhom.trim(),
        userId,
    });

    res.status(201).json({
        status: true,
        message: "debt added successfully",
    });
});

const getdebts = asyncHandler(async (req, res, next) => {

    const userId = req.decoded.id;

    const debt = await Debt.find({ userId },{ "__v": false })
    .sort({ createdAt: -1 }).lean();

    if (!debt.length) {

        const errors = new Error("No debt found");
        errors.statusCode = 404;
        return next(errors);
    }

    res.status(200).json({
        status: true,
        data: debt,
    });
})


const updateDebt = asyncHandler(async (req, res, next) => {
    const { amount,forWhom,unit } = req.body;
    const userId = req.decoded.id; 

    const debtfound = await Debt.findById(req.params.id);
    if (!debtfound) {
        const errors = new Error("Debt not found");
        errors.statusCode = 404;
        return next(errors);
    }
    const debtExist = await Debt.findOne({forWhom: forWhom.trim(),userId,_id: { $ne: req.params.id }});
    if (debtExist) {
        const errors = new Error("debt already exists");
        errors.statusCode = 400;
        return next(errors);
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
            const rate = rates[unit];
            amountInUSD = (amount / rate).toFixed(2);

        } catch (error) {
            console.error("Error fetching exchange rates:", error.message);
            const errors = new Error("Failed to fetch exchange rates");
            errors.statusCode = 500;
            return next(errors);
        }
    }


    const updatedebt = await Debt.findByIdAndUpdate(req.params.id,{ 
        amount:amountInUSD, 
        forWhom: forWhom.trim(),
     },);

    res.status(200).json({
        status: true,
        message: "debt updated successfully",
    });
});

const deleteDebt = asyncHandler(async (req, res, next) => {
    const userId = req.decoded.id;
    const debt = await Debt.findOneAndDelete({ _id: req.params.id, userId });
  
    if (!debt) {
        const errors = new Error("Debt not found");
        errors.statusCode = 404;
        return next(errors);
    }


    res.status(200).json({
        status: true,
        message: "Debt deleted successfully",
    });
})


// CRUD debt paid amount
const addpaid = asyncHandler(async (req, res, next) => {
    const { amount,unit } = req.body;
    const userId = req.decoded.id;

        const debt = await Debt.findOne({ _id: req.params.id, userId });
        if (!debt) {
            const error = new Error("debt not found");
            error.statusCode = 400;
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
        if (amountInUSD <= 0) {
            const error = new Error("The amount is too small");
            error.statusCode = 400;
            return next(error);
        }
        
        if (amountInUSD > (debt.amount - debt.total)) {
            const error = new Error("The payment exceeds the remaining amount");
            error.statusCode = 400;
            return next(error);
        }

        // add  new paid amount
        debt.paidDebt.push({ amount: amountInUSD });

        // Update  total 
        debt.total = debt.total + amountInUSD;
        await debt.save();

        res.status(200).json({
            status: true,
            message: "Amount added successfully",
        });

});

const updatepaid = asyncHandler(async (req, res, next) => {
    const { amount, unit } = req.body;
    const userId = req.decoded.id;
    const { id, paidAmountId } = req.params; 

    const debt = await Debt.findOne({ _id: id, userId });
    if (!debt) {
        const error = new Error("debt not found");
        error.statusCode = 404;
        return next(error);
    }

    const debtpaid = debt.paidDebt.id(paidAmountId);
    if (!debtpaid) {
        const error = new Error("paid amount not found");
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
    if (amountInUSD <= 0) {
        const error = new Error("The amount is too small");
        error.statusCode = 400;
        return next(error);
    }

    // Calculate the difference to update total correctly
    const difference = amountInUSD - debtpaid.amount;

    if (debt.total + difference > debt.amount) {
        const error = new Error("The updated payment exceeds the remaining debt amount");
        error.statusCode = 400;
        return next(error);
    }

    debtpaid.amount = amountInUSD;
    debt.total = debt.total + difference;
    await debt.save();

    res.status(200).json({
        status: true,
        message: "paid amount updated successfully",
    });
});

const deletepaiddebt = asyncHandler(async (req, res, next) => {
    const { id, paidAmountId } = req.params; 
    const userId = req.decoded.id;

    const debt = await Debt.findOne({ _id: id, userId });
    if (!debt) {
        const error = new Error("Debt not found");
        error.statusCode = 404;
        return next(error);
    }

    const paiddebt = debt.paidDebt.id(paidAmountId);
    if (!paiddebt) {
        const error = new Error("paid amount not found");
        error.statusCode = 404;
        return next(error);
    }

    // Remove the paid amount 
    debt.paidDebt.pull(paidAmountId);

    debt.total -= paiddebt.amount;
    await debt.save();

    res.status(200).json({
        status: true,
        message: "paid amount deleted successfully",

    });
});



export { addDebt ,getdebts,updateDebt,deleteDebt,addpaid,updatepaid,deletepaiddebt };
