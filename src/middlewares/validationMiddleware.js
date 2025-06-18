const { body, validationResult } = require('express-validator');

// Validation rules untuk register
const validateRegisterRules = [
    body('username')
        .notEmpty()
        .withMessage('Username wajib diisi')
        .isLength({ min: 3 })
        .withMessage('Username minimal 3 karakter')
        .isLength({ max: 30 })
        .withMessage('Username maksimal 30 karakter')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username hanya boleh huruf, angka, underscore'),
    
    body('email')
        .notEmpty()
        .withMessage('Email wajib diisi')
        .isEmail()
        .withMessage('Format email tidak valid'),
    
    body('password')
        .notEmpty()
        .withMessage('Password wajib diisi')
        .isLength({ min: 6 })
        .withMessage('Password minimal 6 karakter')
        .matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password harus mengandung huruf besar, kecil, dan angka')
];

// Validation rules untuk login
const validateLoginRules = [
    body('email')
        .notEmpty()
        .withMessage('Email wajib diisi')
        .isEmail()
        .withMessage('Format email tidak valid'),
    
    body('password')
        .notEmpty()
        .withMessage('Password wajib diisi')
        .isLength({ min: 6 })
        .withMessage('Password minimal 6 karakter')
];

// Middleware untuk handle validation errors
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validasi gagal',
            errors: errors.array().map(error => error.msg)
        });
    }
    
    next();
};

module.exports = {
    validateRegister: [...validateRegisterRules, handleValidationErrors],
    validateLogin: [...validateLoginRules, handleValidationErrors]
};