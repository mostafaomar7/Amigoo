const slugify = require('slugify')
const asyncHandler = require('express-async-handler')
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
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
  const productsDir = path.join(__dirname, '..', 'uploads', 'products');

  // Ensure the products directory exists
  if (!fs.existsSync(productsDir)) {
    fs.mkdirSync(productsDir, { recursive: true });
  }

  if (req.files.imageCover) {
    const imageCoverFileName = `product-${uuidv4()}-${Date.now()}-cover.webp`;
    const imageCoverPath = path.join(productsDir, imageCoverFileName);

    await sharp(req.files.imageCover[0].buffer)
      .resize({ width: 2000, withoutEnlargement: true }) // تعديل للحفاظ على نسبة الأبعاد الأصلية
      .webp({ quality: 90 })
      .toFile(imageCoverPath);

    req.body.imageCover = imageCoverFileName;
  }

  if (req.files.images) {
    req.body.images = [];
    await Promise.all(
      req.files.images.map(async (img, index) => {
        const imageName = `product-${uuidv4()}-${Date.now()}-${index + 1}.webp`;
        const imagePath = path.join(productsDir, imageName);

        await sharp(img.buffer)
          .resize({ width: 2000, withoutEnlargement: true }) // تعديل للحفاظ على نسبة الأبعاد الأصلية
          .webp({ quality: 90 })
          .toFile(imagePath);

        req.body.images.push(imageName);
      })
    );
  }

  next();
});


//get all product
exports.getProducts = asyncHandler(async(req, res) => {
    const { page: pageQuery, limit: limitQuery, sort, fields, keyword: keywordQuery, minPrice, maxPrice, category_id: categoryId } = req.query;
    const page = pageQuery * 1 || 1;
    const limit = limitQuery * 1 || 16;
    const skip = (page - 1) * limit;

    // Map frontend sort options to backend sort parameters
    // Supports multiple aliases for better user experience
    const sortMapping = {
        // Newest/Latest
        'newest': '-createdAt',
        'latest': '-createdAt',
        'new': '-createdAt',
        // Price: Low to High
        'low_price': 'price',
        'lowest_price': 'price',
        'price_low': 'price',
        'price_asc': 'price',
        // Price: High to Low
        'high_price': '-price',
        'highest_price': '-price',
        'price_high': '-price',
        'price_desc': '-price',
        // Sales: Most sold
        'sales': '-sold',
        'best_selling': '-sold',
        'most_sales': '-sold',
        'popular': '-sold'
    };

    // If sort is provided, map it; otherwise use default (newest)
    let sortBy = '-createdAt';
    if (sort) {
        const normalizedSort = sort.toLowerCase().trim();
        sortBy = sortMapping[normalizedSort] || sort; // Use mapping if exists, otherwise use sort as-is
    }
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

    // Category filter
    const categoryFilter = {};
    if (categoryId) {
        // Validate categoryId
        if (mongoose.Types.ObjectId.isValid(categoryId)) {
            // Use ObjectId for proper MongoDB comparison
            // Mongoose will match this correctly against the category reference field
            categoryFilter.category = new mongoose.Types.ObjectId(categoryId);
        } else {
            // If invalid ObjectId, return empty results
            categoryFilter.category = new mongoose.Types.ObjectId('000000000000000000000000');
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

    // Build filter object - ensure category filter is included
    // eslint-disable-next-line prefer-object-spread
    const filter = Object.assign({}, searchQuery, priceFilter, categoryFilter, { isDeleted: false });

    const selectFields = fields ? fields.split(',').join(' ') : ''; // تحويل الحقول إلى صيغة Mongoose
  //GET /api/products?fields=name,category&sort=-rating&page=2&limit=5 الي هنكتبه ف  url

    // Get total count for pagination
    const totalItems = await product.countDocuments(filter);
    const totalPages = Math.ceil(totalItems / limit);

    // Use lean() to get plain objects and manually populate if needed
    // This ensures the filter works correctly before populate
    let query = product.find(filter).select(selectFields);

    // Only populate if we need category details
    query = query.populate({
        path: 'category',
        select: 'name _id'
    });

    const AllProducts = await query
        .skip(skip)
        .limit(limit)
        .sort(sortBy);

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
    const Product = await product.findOne({ _id: id, isDeleted: false })
        .populate({
            path: 'category',
            select: 'name _id'
        });

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
        const { page: pageQuery, limit: limitQuery, sort } = req.query;

        const page = pageQuery * 1 || 1;
        const limit = limitQuery * 1 || 16;
        const skip = (page - 1) * limit;

        // Map frontend sort options to backend sort parameters
        // Supports multiple aliases for better user experience
        const sortMapping = {
            // Newest/Latest
            'newest': '-createdAt',
            'latest': '-createdAt',
            'new': '-createdAt',
            // Price: Low to High
            'low_price': 'price',
            'lowest_price': 'price',
            'price_low': 'price',
            'price_asc': 'price',
            // Price: High to Low
            'high_price': '-price',
            'highest_price': '-price',
            'price_high': '-price',
            'price_desc': '-price',
            // Sales: Most sold
            'sales': '-sold',
            'best_selling': '-sold',
            'most_sales': '-sold',
            'popular': '-sold'
        };

        // If sort is provided, map it; otherwise use default (newest)
        let sortBy = '-createdAt';
        if (sort) {
            const normalizedSort = sort.toLowerCase().trim();
            sortBy = sortMapping[normalizedSort] || sort; // Use mapping if exists, otherwise use sort as-is
        }

        const filter = { category: categoryId, isDeleted: false };

        // Get total count for pagination
        const totalItems = await product.countDocuments(filter);
        const totalPages = Math.ceil(totalItems / limit);

        const products = await product.find(filter)
            .populate("category", "name")
            .sort(sortBy)
            .skip(skip)
            .limit(limit);

        res.status(200).json({
          success: true,
          result: products.length,
          data: products,
          pagination: {
            currentPage: page,
            itemsPerPage: limit,
            totalItems: totalItems,
            totalPages: totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
          }
        });
      });
