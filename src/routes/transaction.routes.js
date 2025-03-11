import express from 'express';
import { addTransaction,getTransactions,editTransaction,delTransaction ,getMonthlyStats } from '../controllers/transactions.controller.js';
import isLoggedIn from '../middlewares/isLoggedIn.js';
import {TranValidation,validationMiddleware} from '../middlewares/validations.js';


const router = express.Router();

router.get('/',isLoggedIn,getTransactions);
router.post('/',isLoggedIn,TranValidation,validationMiddleware, addTransaction);
router.put('/:id',isLoggedIn,TranValidation,validationMiddleware, editTransaction);
router.delete('/:id',isLoggedIn,delTransaction);



router.get("/monthlystats",isLoggedIn, getMonthlyStats);
// router.get("/tranbyCat",isLoggedIn, getTransactionCategories);

export default router;