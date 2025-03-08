const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.registerUser = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // التحقق من البيانات الأساسية
        if (!name || !email || !password || !role) {
            return res.status(400).json({ message: 'يرجى إدخال جميع الحقول' });
        }

        // التحقق إذا كان المستخدم مسجل مسبقًا
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'البريد الإلكتروني مسجل بالفعل' });
        }

        // تشفير كلمة المرور
        const hashedPassword = await bcrypt.hash(password, 12);

        // إنشاء مستخدم جديد
        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            role, // يمكن أن يكون 'user' أو 'Admin'
        });

        await newUser.save();

         // إنشاء JWT بعد تسجيل المستخدم
        const token = jwt.sign({ id: newUser._id, email: newUser.email, role: newUser.role }, process.env.JWT_SECRET, {expiresIn: process.env.EXPIRE_TIME });

        res.status(201).json({ message: 'تم التسجيل بنجاح', user: newUser,token });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'خطأ في الخادم', error });
    }
};


exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // التحقق من إدخال البريد وكلمة المرور
        if (!email || !password) {
            return res.status(400).json({ message: 'يرجى إدخال البريد الإلكتروني وكلمة المرور' });
        }

        // العثور على المستخدم
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'المستخدم غير موجود' });
        }

        // مقارنة كلمة المرور
        const isPasswordValid = await bcrypt.compare(password,user.password);
        if (!isPasswordValid) {
            console.log(password,user.password);
            return res.status(401).json({ message: 'كلمة المرور غير صحيحة' });
        } 


         // إنشاء JWT
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {expiresIn: process.env.EXPIRE_TIME });
        res.status(200).json({ message: 'تم تسجيل الدخول بنجاح', token ,user});

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'خطأ في الخادم', error });
    }
};
