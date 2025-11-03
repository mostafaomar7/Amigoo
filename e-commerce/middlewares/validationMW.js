const { body, param, validationResult } = require('express-validator');


exports.validateUserRegistration = [
    body('name').isString().notEmpty().withMessage('الاسم مطلوب'),
    body('email').isEmail().withMessage('البريد الإلكتروني غير صالح'),
    body('password').isLength({ min: 6 }).withMessage('كلمة المرور يجب أن تكون على الأقل 6 أحرف'),
    body('role').isIn(['user', 'Admin']).withMessage('الدور يجب أن يكون user أو Admin'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'فشل في التحقق من صحة البيانات',
                errors: errors.array()
            });
        }
        next();
    }
];
// Middleware login للتحقق من صحة بيانات تسجيل المستخدم
exports.validateUserlogin = [
    body('email').isEmail().withMessage('البريد الإلكتروني غير صالح'),
    body('password').isLength({ min: 6 }).withMessage("كلمة السر غير صحيحة"),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'فشل في التحقق من صحة البيانات',
                errors: errors.array()
            });
        }
        next();
    }
];
