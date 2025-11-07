const jwt = require('jsonwebtoken');
require('dotenv').config();


const jwtSecret = process.env.JWT_SECRET; // المفتاح السري من متغيرات البيئة

if (!jwtSecret) {
    throw new Error('JWT_SECRET is not defined in environment variables.');
}

// Middleware للمصادقة
exports.authenticate = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {

        return res.status(401).json({ message: 'لم يتم توفير رمز المصادقة' });
    }

    try {
        const decoded = jwt.verify(token, jwtSecret);
        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'رمز المصادقة منتهي الصلاحية' });
        }

    return res.status(401).json({ message: 'رمز المصادقة غير صالح' });
    }
};

// Middleware للتحقق من دور المستخدم
exports.authorize = (roles) => (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: 'لم يتم توفير مصادقة المستخدم' });
    }
    if (!roles.includes(req.user.role)) {
        return res.status(403).json({ message: 'ليس لديك إذن للقيام بهذا الإجراء' });
    }
    next();
};
