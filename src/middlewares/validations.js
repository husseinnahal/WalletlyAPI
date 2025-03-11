import { body, validationResult } from "express-validator";

const registrValidation = [
    body('username')
        .notEmpty().withMessage('Username is required').trim()
        .isLength({ min: 3 }).withMessage('Username must be at least 3 characters')
        .isLength({ max: 50 }).withMessage('Username must be less than 50 characters'),

    body('email')
        .notEmpty().withMessage('Email is required').trim()
        .isEmail().withMessage('Please enter a valid email'),

    body('password')
        .notEmpty().withMessage('Password is required').trim()
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
        .matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/)
        .withMessage('Password must contain at least one uppercase letter,one number,and one special character'),
];

const loginValidation = [
    body('email').notEmpty().withMessage('Email is required').trim(),

    body('password').notEmpty().withMessage('Password is required').trim(),
];

const updatedUserValidation = [
    body('username')
        .notEmpty().withMessage('Username is required').trim()
        .isLength({ min: 3 }).withMessage('Username must be at least 3 characters')
        .isLength({ max: 40 }).withMessage('Username must be less than 40 characters'),
    
    body('email')
        .notEmpty().withMessage('Email is required').trim()
        .isEmail().withMessage('Please enter a valid email'),
]

const updatePasswordValidation = [
    body('oldPassword')
    .notEmpty().withMessage('Old password is required').trim(),

    body('newPassword')
    .notEmpty().withMessage('New password is required').trim()
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/)
    .withMessage('Password must contain at least one uppercase letter,one number,and one special character'),

]

const CatValidation=[
    body('name')
    .notEmpty().withMessage('Name is required').trim()
    .isLength({ min: 3 }).withMessage('Name must be at least 3 characters')
    .isLength({ max: 20 }).withMessage('Name must be less than 20 characters'),
    
];

const TranValidation=[
    body('title')
    .notEmpty().withMessage('Title is required').trim()
    .isLength({ min: 3 }).withMessage('Title must be at least 3 characters')
    .isLength({ max: 50 }).withMessage('Title must be less than 50 characters'),

    body('amount')
    .notEmpty().withMessage('Amount is required')
    .isFloat({ min: 0.01 }).withMessage('Amount must be a valid number greater than 0'),


    body('type')
    .notEmpty().withMessage('Type is required').trim()
    .isIn(['income', 'expense']).withMessage('Type must be either income or expense'),

    body('categoryId')
    .notEmpty().withMessage('Category is required').trim(),

    body('unit')
    .notEmpty().withMessage('Unit is required').trim()
];

const goalValidation = [
    body('title')
        .notEmpty().withMessage('Title is required').trim()
        .isLength({ min: 3 }).withMessage('Title must be at least 3 characters')
        .isLength({ max: 50 }).withMessage('Title must be less than 50 characters'),

    body('amount')
        .notEmpty().withMessage('Amount is required')
        .isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),

        body('unit')
        .notEmpty().withMessage('Unit is required').trim()
]


const savedAmountValidation = [
    body('amount')
        .notEmpty().withMessage('Amount is required')
        .isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
        
    body('unit')
        .notEmpty().withMessage('Unit is required').trim()
]

const debtValidation = [
    body('amount')
        .notEmpty().withMessage('Amount is required')
        .isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),

    body('forWhom')
        .notEmpty().withMessage('For whom is required').trim()
        .isLength({ min: 3 }).withMessage('For whom must be at least 3 characters'),

    body('unit')
        .notEmpty().withMessage('Unit is required').trim()
];

const validationMiddleware = (req, res, next) => {
    const result = validationResult(req);
    if (result.isEmpty()) {
        return next();
    }

    const messages = result.array().map((err) => ({
        path: err.path,
        message: err.msg
    }));

    return res.status(400).json({
        status: false,
        error: messages
    });
};

export {
    validationMiddleware,
    registrValidation,
    loginValidation,
    updatedUserValidation,
    updatePasswordValidation,
    CatValidation,
    TranValidation,
    goalValidation,
    savedAmountValidation,
    debtValidation
};
