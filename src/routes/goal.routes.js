import express from 'express';
import { addgoal,getGoals ,updateGoals,deleteGoal ,getPayments,addSavedAmount,updateSavedAmount,deleteSavedAmount} from '../controllers/savingGoal.controller.js';
import isLoggedIn from '../middlewares/isLoggedIn.js';
import {goalValidation,savedAmountValidation,validationMiddleware} from '../middlewares/validations.js';
import multer from 'multer';
import optionalUpload from '../middlewares/optionalUpload.js';

const router = express.Router();
const multerStorage = multer.memoryStorage();
const upload = multer({ storage: multerStorage });

// goal routes
router.get('/',isLoggedIn,getGoals);
router.post('/',isLoggedIn,upload.single('image'),goalValidation,validationMiddleware, addgoal);
router.put('/:id',isLoggedIn,optionalUpload,goalValidation,validationMiddleware, updateGoals);
router.delete('/:id',isLoggedIn,deleteGoal);


// add saved amount
router.get('/saved-amount/:id',isLoggedIn,getPayments);
router.post('/saved-amount/:id',isLoggedIn,savedAmountValidation,validationMiddleware,addSavedAmount);
router.put('/saved-amount/:id/:savedAmountId',isLoggedIn,savedAmountValidation,validationMiddleware,updateSavedAmount);
router.delete('/saved-amount/:id/:savedAmountId',isLoggedIn,deleteSavedAmount);



export default router;