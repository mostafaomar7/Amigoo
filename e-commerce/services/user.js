const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

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
            return res.status(401).json({ message: 'كلمة المرور غير صحيحة' });
        }


         // إنشاء JWT
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {expiresIn: process.env.EXPIRE_TIME });
        res.status(200).json({ message: 'تم تسجيل الدخول بنجاح', token ,user});

    } catch (error) {
        res.status(500).json({ message: 'خطأ في الخادم', error });
    }
};

// Get all users (admin only) with pagination
exports.getAllUsers = asyncHandler(async (req, res) => {
    const { page: pageQuery, limit: limitQuery, sort: sortQuery, keyword: keywordQuery, role } = req.query;
    const page = pageQuery * 1 || 1;
    const limit = limitQuery * 1 || 10;
    const skip = (page - 1) * limit;
    const sort = sortQuery || 'createdAt';
    const keyword = keywordQuery || '';

    // Build search query
    const searchQuery = keyword
        ? {
            $or: [
                { name: { $regex: keyword, $options: 'i' } },
                { email: { $regex: keyword, $options: 'i' } },
            ],
        }
        : {};

    // Build filter
    const filter = Object.assign({}, searchQuery);
    if (role) {
        filter.role = role;
    }

    // Get total count for pagination
    const totalItems = await User.countDocuments(filter);
    const totalPages = Math.ceil(totalItems / limit);

    // Get users
    const users = await User.find(filter)
        .select('-password') // Exclude password from response
        .skip(skip)
        .limit(limit)
        .sort(sort);

    res.status(200).json({
        success: true,
        message: 'Users retrieved successfully',
        data: users,
        pagination: {
            currentPage: page,
            itemsPerPage: limit,
            totalItems: totalItems,
            totalPages: totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
        },
    });
});

// Get user by ID (admin only)
exports.getUserById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const user = await User.findById(id).select('-password');

    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found',
        });
    }

    res.status(200).json({
        success: true,
        message: 'User retrieved successfully',
        data: user,
    });
});
