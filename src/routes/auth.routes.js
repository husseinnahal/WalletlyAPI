import express from 'express';
import {registration,login,editUser,updatePassword ,getuser} from '../controllers/auth.controller.js';
import {registrValidation,loginValidation,updatedUserValidation,updatePasswordValidation,validationMiddleware} from '../middlewares/validations.js';
import isLoggedIn from '../middlewares/isLoggedIn.js';
import multer from 'multer';
import optionalUpload from '../middlewares/optionalUpload.js';

const router = express.Router();
const multerStorage = multer.memoryStorage();
const upload = multer({ storage: multerStorage });

router.get('/',isLoggedIn,getuser)
router.post('/registration',registrValidation,validationMiddleware, registration);
router.post('/login',loginValidation,validationMiddleware, login);
router.put('/updateUser',isLoggedIn,optionalUpload,updatedUserValidation,validationMiddleware, editUser);
router.put('/updatePassword',isLoggedIn,updatePasswordValidation,validationMiddleware, updatePassword);



export default router;