import express from 'express';
import { addDebt ,getdebts,updateDebt,deleteDebt ,addpaid,updatepaid,deletepaiddebt,getPayments} from '../controllers/debt.controller.js';
import isLoggedIn from '../middlewares/isLoggedIn.js';
import {debtValidation,savedAmountValidation,validationMiddleware } from '../middlewares/validations.js';


const router = express.Router();


// debt routes
router.get('/',isLoggedIn,getdebts);
router.post('/',isLoggedIn,debtValidation,validationMiddleware ,addDebt);
router.put('/:id',isLoggedIn,debtValidation,validationMiddleware,  updateDebt);
router.delete('/:id',isLoggedIn,deleteDebt);



// add paid amount
router.get('/paid/:id',isLoggedIn,getPayments);
router.post('/paid/:id',isLoggedIn,savedAmountValidation,validationMiddleware,addpaid);
router.put('/paid/:id/:paidAmountId',isLoggedIn,savedAmountValidation,validationMiddleware,updatepaid);
router.delete('/paid/:id/:paidAmountId',isLoggedIn,deletepaiddebt);

export default router;