const slugify = require('slugify')
const asyncHandler = require('express-async-handler')
const multer  = require('multer')
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');
const path = require('path');
const Category = require('../models/categoryModel');

const multerStorage = multer.memoryStorage();

const multerFilter = function  (req, file, cb) {
  if(file.mimetype.startsWith("image")){
 // To accept the file pass `true`, like so:
 cb(null, true)
  }else{
      // You can always pass an error if something goes wrong:
       cb(new Error('I don\'t have image!, shoud to be image'))

  }
}

const upload = multer({ storage: multerStorage, fileFilter: multerFilter })
exports.uploadimage = upload.single('image');

// Middleware to convert category image to WebP
exports.resizeCategoryImage = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  const webpFileName = `category-${uuidv4()}-${Date.now()}.webp`;
  const outputPath = path.join(__dirname, '..', 'uploads', 'category', webpFileName);

  await sharp(req.file.buffer)
    .resize({ width: 800, height: 600, fit: 'cover' })
    .webp({ quality: 85 })
    .toFile(outputPath);

  req.body.image = webpFileName;
  next();
});
////

//get all categore
exports.getCategories = asyncHandler(async(req, res) => {
    const { page = 1, limit = 10, sort = 'createdAt', fields, keyword = '' } = req.query;
    const pageNum = page * 1 || 1;
    const limitNum = limit * 1 || 10;
    const skip = (pageNum - 1) * limitNum; /*skip categore*/
    const sortBy = sort; // معيار الفرز الافتراضي
    const selectFields = fields ? fields.split(',').join(' ') : ''; // تحويل الحقول إلى صيغة Mongoose

    const searchQuery = keyword
    ? {
          $or: [
              { name: { $regex: keyword, $options: 'i' } }, // البحث في الاسم
          ],
      }
    : {};

    const query = { ...searchQuery, isDeleted: false };

    // Get total count for pagination
    const totalItems = await Category.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limitNum);

    const AllCategore = await Category.find(query).select(selectFields).skip(skip).limit(limitNum).sort(sortBy);

    res.status(200).json({
      success: true,
      message: 'تم جلب الفئات بنجاح',
      data: AllCategore,
      pagination: {
        currentPage: pageNum,
        itemsPerPage: limitNum,
        totalItems: totalItems,
        totalPages: totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    })
});

exports.getCategory = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const category = await Category.findOne({ _id: id, isDeleted: false });
    if (!category) {
      res.status(404).json({
        success: false,
        message: `لا توجد فئة بهذا المعرف ${id}`
      });
    }
    res.status(200).json({
      success: true,
      message: 'تم جلب الفئة بنجاح',
      data: category
    });
  });

//CREAT categore
exports.CreatCategories = asyncHandler(async(req, res) => {
    const { name } = req.body;
    const image = req.body.image;

    try {
        const category = await Category.create({name:name,slug:slugify(name),image:image})
        res.status(201).json({
            success: true,
            message: 'تم إنشاء الفئة بنجاح',
            data: category
        });
    } catch (error) {
        // Handle validation errors
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => ({
                field: err.path,
                message: err.message
            }));
            return res.status(400).json({
                success: false,
                message: 'فشل في التحقق من صحة البيانات',
                errors: validationErrors
            });
        }

        // Handle duplicate key error
        if (error.code === 11000) {
            const field = Object.keys(error.keyValue)[0];
            const fieldNames = {
                'name': 'الاسم',
                'email': 'البريد الإلكتروني',
                'slug': 'الرابط'
            };
            const fieldName = fieldNames[field] || field;
            return res.status(400).json({
                success: false,
                message: `${fieldName} يجب أن يكون فريداً`,
                errors: [{
                    field: field,
                    message: `${fieldName} يجب أن يكون فريداً`
                }]
            });
        }

        // Handle mongoose duplicate key error
        if (error.name === 'MongooseError' && error.message.includes('must be unique')) {
            const field = error.message.split(' ')[0];
            const fieldNames = {
                'Category': 'الفئة',
                'Product': 'المنتج',
                'User': 'المستخدم'
            };
            const fieldName = fieldNames[field] || field;
            return res.status(400).json({
                success: false,
                message: `${fieldName} يجب أن يكون فريداً`,
                errors: [{
                    field: field.toLowerCase(),
                    message: `${fieldName} يجب أن يكون فريداً`
                }]
            });
        }

        // Re-throw other errors to be handled by global error handler
        throw error;
    }
});

exports.updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  const image = req.body.image;

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'اسم الفئة مطلوب ويجب أن يكون نصاً صالحاً.'
    });
  }

  const updateData = { name, slug: slugify(name, { lower: true }) };
  if (image) updateData.image = image;

  const category = await Category.findOneAndUpdate({ _id: id, isDeleted: false }, updateData, { new: true });

  if (!category) {
    return res.status(404).json({
      success: false,
      message: `لا توجد فئة بهذا المعرف: ${id}`
    });
  }

  res.status(200).json({
    success: true,
    message: 'تم تحديث الفئة بنجاح',
    data: category
  });
});


exports.deleteCategory = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const category = await Category.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );

    if (!category) {
      res.status(404).json({
        success: false,
        message: `لا توجد فئة بهذا المعرف ${id}`
      });
    }
    res.status(200).json({
      success: true,
      message: "تم حذف الفئة بنجاح",
      data: category
    });
  });
