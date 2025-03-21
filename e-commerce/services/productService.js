const slugify = require('slugify')
const asyncHandler = require('express-async-handler')
const multer  = require('multer')
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');
const { uploadMixOfImages } = require('../middlewares/uploadImageMiddleware');
const product = require('../models/productModel');


exports.uploadProductImages = uploadMixOfImages([
  {
    name: 'imageCover',
    maxCount: 1,
  },
  {
    name: 'images',
    maxCount: 5,
  },
]);

exports.resizeProductImages = asyncHandler(async (req, res, next) => {
  if (req.files.imageCover) {
    const imageCoverFileName = `product-${uuidv4()}-${Date.now()}-cover.jpeg`;

    await sharp(req.files.imageCover[0].buffer)
      .resize({ width: 2000 }) // تعديل للحفاظ على نسبة الأبعاد الأصلية
      .toFormat('jpeg')
      .jpeg({ quality: 100 })
      .toFile(`uploads/products/${imageCoverFileName}`);

    req.body.imageCover = imageCoverFileName;
  }

  if (req.files.images) {
    req.body.images = [];
    await Promise.all(
      req.files.images.map(async (img, index) => {
        const imageName = `product-${uuidv4()}-${Date.now()}-${index + 1}.jpeg`;

        await sharp(img.buffer)
          .resize({ width: 2000 }) // تعديل للحفاظ على نسبة الأبعاد الأصلية
          .toFormat('jpeg')
          .jpeg({ quality: 95 })
          .toFile(`uploads/products/${imageName}`);

        req.body.images.push(imageName);
      })
    );
  }

  next();
});


//get all product
exports.getProducts = asyncHandler(async(req, res) => {
    const page = req.query.page * 1 || 1;
    const limit = req.query.limit * 16 ;
    const skip = (page - 1) * limit /*skip categore*/ ;
    const sortBy = req.query.sort || 'createdAt'; // معيار الفرز الافتراضي
    const fields = req.query.fields; // الحقول المطلوبة
    const keyword = req.query.keyword || ''; // الكلمة المفتاحية للبحث

    const priceFilter = {};
    if (req.query.minPrice) {
      priceFilter.price = { $gte: req.query.minPrice * 1 }; // الحد الأدنى
  }
  if (req.query.maxPrice) {
      priceFilter.price = priceFilter.price 
          ? { ...priceFilter.price, $lte: req.query.maxPrice * 1 } // الحد الأقصى
          : { $lte: req.query.maxPrice * 1 };
  }
  

    const searchQuery = keyword
    ? {
          $or: [
              { title: { $regex: keyword, $options: 'i' } }, // البحث في الاسم
              { description: { $regex: keyword, $options: 'i' } }, // البحث في الوصف
          ],
      }
    : {};

    const filter = { ...searchQuery, ...priceFilter };

    const selectFields = fields ? fields.split(',').join(' ') : ''; // تحويل الحقول إلى صيغة Mongoose
  //GET /api/products?fields=name,category&sort=-rating&page=2&limit=5 الي هنكتبه ف  url
    const AllProducts = await product.find(filter).select(selectFields) // تحديد الحقول
    .skip(skip).limit(limit).sort(sortBy) // تطبيق البحث بالكلمة المفتاحية
    // إضافة الفرز
    ; 
    res.status(201).json({data:AllProducts})
});

exports.getproduct = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const Product = await product.findById(id);
    if (!Product) {
      res.status(404).json({ msg: `No product for this id ${id}` });
    }
    res.status(200).json({ data: Product });
  });

//CREAT product
exports.CreatProducts = asyncHandler(async(req, res) => {
    req.body.slug=slugify(req.body.title)
    const Product = await product.create(req.body)
    res.status(201).json({data:Product}) 
});


exports.updateProduct= asyncHandler(async (req, res) => {
    const { id } = req.params;
    req.body.slug=slugify(req.body.title)
  
    const Product = await product.findOneAndUpdate(
      { _id: id },
     req.body,
      { new: true }
    );
  
    if (!Product) {
      res.status(404).json({ msg: `No product for this id ${id}` });
    }
    res.status(200).json({ data: Product });
  });


exports.deleteProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const Product = await product.findByIdAndDelete(id);
  
    if (!Product) {
      res.status(404).json({ msg: `No product for this id ${id}` });
    }
    res.status(200).json({msg: "product deleted successfully", data: Product,});
  });
  exports.getProductsByCategory = asyncHandler(async (req, res) => {
        const { categoryId } = req.params;
        
        const products = await product.find({ category: categoryId }).populate("category", "name");
      
        res.status(200).json({
          result: products.length,
          data: products,
        });
      });
