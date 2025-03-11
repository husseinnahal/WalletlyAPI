import express from 'express';
import { addcategory,getCategories ,editCategory} from '../controllers/category.controller.js';
import isLoggedIn  from '../middlewares/isLoggedIn.js';
import {CatValidation,validationMiddleware} from '../middlewares/validations.js';
import multer from 'multer';
import optionalUpload from '../middlewares/optionalUpload.js';

const router = express.Router();
const multerStorage = multer.memoryStorage();
const upload = multer({ storage: multerStorage });


router.get('/',isLoggedIn,getCategories);
router.post('/',isLoggedIn,upload.single('image'),CatValidation,validationMiddleware, addcategory);
router.put('/:id',isLoggedIn,optionalUpload,CatValidation,validationMiddleware,  editCategory);

export default router;