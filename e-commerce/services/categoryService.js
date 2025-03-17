const slugify = require('slugify')
const asyncHandler = require('express-async-handler')
const Category = require('../models/categoryModel');
///// image
const multer  = require('multer')
const { v4: uuidv4 } = require('uuid');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/category')
  },
  filename: function (req, file, cb) {
    const ext = file.mimetype.split("/")[1];
    const filename =`category-${uuidv4()}-${Date.now()}-.${ext}`
    cb(null,filename  )
    console.log(req.file);
    
    req.body.image=filename

  }

})

const multerFilter = function  (req, file, cb) {
  if(file.mimetype.startsWith("image")){
 // To accept the file pass `true`, like so:
 cb(null, true)
  }else{
      // You can always pass an error if something goes wrong:
       cb(new Error('I don\'t have image!, shoud to be image'))

  }
}

const upload = multer({ storage: storage,fileFilter:multerFilter })
exports.uploadimage = upload.single('image');
////

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
