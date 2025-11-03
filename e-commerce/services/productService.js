const slugify = require('slugify')
const asyncHandler = require('express-async-handler')
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');
const { uploadMixOfImages } = require('../middlewares/uploadImageMiddleware');
const product = require('../models/productModel');
const Size = require('../models/sizeModel');


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
    const imageCoverFileName = `product-${uuidv4()}-${Date.now()}-cover.webp`;

    await sharp(req.files.imageCover[0].buffer)
      .resize({ width: 2000, withoutEnlargement: true }) // تعديل للحفاظ على نسبة الأبعاد الأصلية
      .webp({ quality: 90 })
      .toFile(`uploads/products/${imageCoverFileName}`);

    req.body.imageCover = imageCoverFileName;
  }

  if (req.files.images) {
    req.body.images = [];
    await Promise.all(
      req.files.images.map(async (img, index) => {
        const imageName = `product-${uuidv4()}-${Date.now()}-${index + 1}.webp`;

        await sharp(img.buffer)
          .resize({ width: 2000, withoutEnlargement: true }) // تعديل للحفاظ على نسبة الأبعاد الأصلية
          .webp({ quality: 90 })
          .toFile(`uploads/products/${imageName}`);

        req.body.images.push(imageName);
      })
    );
  }

  next();
});


//get all product
exports.getProducts = asyncHandler(async(req, res) => {
    const { page: pageQuery, limit: limitQuery, sort, fields, keyword: keywordQuery, minPrice, maxPrice } = req.query;
    const page = pageQuery * 1 || 1;
    const limit = limitQuery * 1 || 16;
    const skip = (page - 1) * limit;
    const sortBy = sort || 'createdAt'; // معيار الفرز الافتراضي
    const keyword = keywordQuery || ''; // الكلمة المفتاحية للبحث

    const priceFilter = {};
    if (minPrice) {
      priceFilter.price = { $gte: minPrice * 1 }; // الحد الأدنى
  }
  if (maxPrice) {
      if (priceFilter.price) {
          priceFilter.price.$lte = maxPrice * 1; // الحد الأقصى
      } else {
          priceFilter.price = { $lte: maxPrice * 1 };
      }
  }


    const searchQuery = keyword
    ? {
          $or: [
              { title: { $regex: keyword, $options: 'i' } }, // البحث في الاسم
              { description: { $regex: keyword, $options: 'i' } }, // البحث في الوصف
          ],
      }
    : {};

    const filter = Object.assign({}, searchQuery, priceFilter, { isDeleted: false });

    const selectFields = fields ? fields.split(',').join(' ') : ''; // تحويل الحقول إلى صيغة Mongoose
  //GET /api/products?fields=name,category&sort=-rating&page=2&limit=5 الي هنكتبه ف  url

    // Get total count for pagination
    const totalItems = await product.countDocuments(filter);
    const totalPages = Math.ceil(totalItems / limit);

    const AllProducts = await product.find(filter).select(selectFields) // تحديد الحقول
    .skip(skip).limit(limit).sort(sortBy) // تطبيق البحث بالكلمة المفتاحية
    // إضافة الفرز
    ;

    res.status(200).json({
      success: true,
      data: AllProducts,
      pagination: {
        currentPage: page,
        itemsPerPage: limit,
        totalItems: totalItems,
        totalPages: totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      }
    })
});

exports.getproduct = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const Product = await product.findOne({ _id: id, isDeleted: false });
    if (!Product) {
      return res.status(404).json({
          success: false,
          msg: `No product for this id ${id}`
      });
    }

    res.status(200).json({
        success: true,
        data: Product
    });
  });

//CREAT product
exports.CreatProducts = asyncHandler(async(req, res) => {
    req.body.slug=slugify(req.body.title)

    // Extract quantity array from request body
    const quantityArray = req.body.quantity || [];

    // Validate and normalize quantity array
    if (quantityArray.length > 0) {
        // Validate that all sizes exist in master sizes collection
        const validationResults = await Promise.all(
            quantityArray.map(async (item) => {
                const sizeExists = await Size.findOne({
                    sizeName: (item.size || '').toLowerCase().trim(),
                    isActive: true
                });

                if (!sizeExists) {
                    return { error: `Size "${item.size}" does not exist. Please create it first.` };
                }

                // Validate quantity (no field)
                if (item.no === undefined || item.no === null) {
                    return { error: `Quantity (no) is required for size "${item.size}".` };
                }

                if (typeof item.no !== 'number' || item.no < 0) {
                    return { error: `Quantity (no) must be a non-negative number for size "${item.size}".` };
                }

                return { valid: true };
            })
        );

        // Check for validation errors
        const errorResult = validationResults.find(result => result.error);
        if (errorResult) {
            return res.status(400).json({
                success: false,
                message: errorResult.error,
            });
        }

        // Normalize quantity array - convert size to lowercase
        req.body.quantity = quantityArray.map(item => ({
            size: (item.size || '').toLowerCase().trim(),
            no: Number(item.no) || 0
        }));
    }

    // Create the product
    const Product = await product.create(req.body)

    res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: Product
    });
});


exports.updateProduct= asyncHandler(async (req, res) => {
    const { id } = req.params;
    req.body.slug=slugify(req.body.title)

    // Validate and normalize quantity array if provided
    if (req.body.quantity !== undefined) {
        const quantityArray = req.body.quantity;

        if (!Array.isArray(quantityArray)) {
            return res.status(400).json({
                success: false,
                message: 'Quantity must be an array.',
            });
        }

        // Validate that all sizes exist in master sizes collection
        const validationResults = await Promise.all(
            quantityArray.map(async (item) => {
                const sizeExists = await Size.findOne({
                    sizeName: (item.size || '').toLowerCase().trim(),
                    isActive: true
                });

                if (!sizeExists) {
                    return { error: `Size "${item.size}" does not exist. Please create it first.` };
                }

                // Validate quantity (no field)
                if (item.no === undefined || item.no === null) {
                    return { error: `Quantity (no) is required for size "${item.size}".` };
                }

                if (typeof item.no !== 'number' && typeof item.no !== 'string') {
                    return { error: `Quantity (no) must be a number for size "${item.size}".` };
                }

                return { valid: true };
            })
        );

        // Check for validation errors
        const errorResult = validationResults.find(result => result.error);
        if (errorResult) {
            return res.status(400).json({
                success: false,
                message: errorResult.error,
            });
        }

        // Normalize quantity array - convert size to lowercase and no to number
        req.body.quantity = quantityArray.map(item => ({
            size: (item.size || '').toLowerCase().trim(),
            no: Number(item.no) || 0
        }));
    }

    const Product = await product.findOneAndUpdate(
      { _id: id, isDeleted: false },
     req.body,
      { new: true }
    );

    if (!Product) {
      return res.status(404).json({
          success: false,
          msg: `No product for this id ${id}`
      });
    }

    res.status(200).json({
        success: true,
        message: 'Product updated successfully',
        data: Product
    });
  });


exports.deleteProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const Product = await product.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );

    if (!Product) {
      res.status(404).json({ msg: `No product for this id ${id}` });
    }
    res.status(200).json({msg: "product deleted successfully", data: Product,});
  });
  exports.getProductsByCategory = asyncHandler(async (req, res) => {
        const { categoryId } = req.params;

        const products = await product.find({ category: categoryId, isDeleted: false }).populate("category", "name");

        res.status(200).json({
          result: products.length,
          data: products,
        });
      });
