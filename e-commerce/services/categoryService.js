const slugify = require('slugify')
const asyncHandler = require('express-async-handler')
const Category = require('../models/categoryModel');
const cloudinary = require('../config/config/cloudinary');
const multer = require('multer');


///// image
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// إعداد التخزين لمولتر (رفع الصور إلى Cloudinary)
const categoryStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'categories', // اسم المجلد في Cloudinary
    allowed_formats: ['jpeg', 'png', 'jpg'], // أو يمكن استخدام "png"
    public_id: (req, file) => `category-${Date.now()}-${file.originalname}` // اسم الصورة
  },
});

// إعداد رفع الملفات باستخدام Multer
const categoryUpload = multer({ storage: categoryStorage });

// ميدل وير لرفع الصورة
exports.uploadCategoryImage = async (req, res, next) => {
  categoryUpload.single('image')(req, res, async function (err) {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'لم يتم رفع صورة!' });
    }

    // رفع الصورة إلى Cloudinary والحصول على الرابط الصحيح
    try {
      const result = await cloudinary.uploader.upload(req.file.path);
      req.body.image = result.secure_url; // حفظ الرابط النهائي في الطلب
      next();
    } catch (uploadError) {
      return res.status(500).json({ error: 'فشل رفع الصورة إلى Cloudinary', details: uploadError.message });
    }
  });
};

//get all categore
exports.getCategories = asyncHandler(async(req, res) => {
    const page = req.query.page * 1 || 1;
    const limit = req.query.limit * 1 ;
    const skip = (page - 1) * limit /*skip categore*/ 
    const sortBy = req.query.sort || 'createdAt'; // معيار الفرز الافتراضي
    const fields = req.query.fields; // الحقول المطلوبة
    const keyword = req.query.keyword || ''; // الكلمة المفتاحية للبحث

    const searchQuery = keyword
    ? {
          $or: [
              { name: { $regex: keyword, $options: 'i' } }, // البحث في الاسم
          ],
      }
    : {};

    const selectFields = fields ? fields.split(',').join(' ') : ''; // تحويل الحقول إلى صيغة Mongoose

    const AllCategore = await Category.find(searchQuery).select(selectFields).skip(skip).limit(limit).sort(sortBy); 
    res.status(201).json({data:AllCategore})
});

exports.getCategory = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const category = await Category.findById(id);
    if (!category) {
      res.status(404).json({ msg: `No category for this id ${id}` });
    }
    res.status(200).json({ data: category });
  });

//CREAT categore
exports.CreatCategories = asyncHandler(async(req, res) => {
    const name = req.body.name ;
    const image = req.body.image || req.file;
    const category = await Category.create({name:name,slug:slugify(name),image:image})
    res.status(201).json({data:category})
    
    
});

exports.updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  const image = req.body.image || (req.file ? req.file.filename : null);

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ msg: 'Category name is required and must be a valid string.' });
  }

  const updateData = { name, slug: slugify(name, { lower: true }) };
  if (image) updateData.image = image;

  const category = await Category.findOneAndUpdate({ _id: id }, updateData, { new: true });

  if (!category) {
    return res.status(404).json({ msg: `No category found for this ID: ${id}` });
  }

  res.status(200).json({ data: category });
});

// exports.updateCategory = asyncHandler(async (req, res) => {
//   const { id } = req.params;
//   const { name, image } = req.body;

//   // التحقق من أن `name` موجود وصالح
//   if (!name || typeof name !== 'string' || name.trim() === '') {
//     return res.status(400).json({ msg: 'Category name is required and must be a valid string.' });
//   }

//   const category = await Category.findOneAndUpdate(
//     { _id: id },
//     { 
//       name, 
//       slug: slugify(name, { lower: true }), // تأكد أن الاسم يستخدم في slugify بعد التحقق
//       image // تحديث الصورة أيضًا
//     },
//     { new: true }
//   );

//   if (!category) {
//     return res.status(404).json({ msg: `No category for this id ${id}` });
//   }

//   res.status(200).json({ data: category });
// });


exports.deleteCategory = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const category = await Category.findByIdAndDelete(id);
  
    if (!category) {
      res.status(404).json({ msg: `No category for this id ${id}` });
    }
    res.status(200).json({msg: "Category deleted successfully", data: category,});
  });   
