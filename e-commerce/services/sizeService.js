const asyncHandler = require('express-async-handler');
const Size = require('../models/sizeModel');
const Product = require('../models/productModel');

// Get all active sizes for dropdown (admin only)
exports.getMasterSizes = asyncHandler(async (req, res) => {
  const sizes = await Size.find()
    .select('sizeName _id')
    .sort({ sizeName: 1 });

  res.status(200).json({
    success: true,
    message: 'Sizes retrieved successfully',
    data: sizes,
  });
});

// Get all sizes (admin only) with pagination
exports.getAllSizes = asyncHandler(async (req, res) => {
  const { page: pageQuery, limit: limitQuery, keyword: keywordQuery } = req.query;
  const page = pageQuery * 1 || 1;
  const limit = limitQuery * 1 || 10;
  const skip = (page - 1) * limit;
  const keyword = keywordQuery || '';

  const searchQuery = keyword
    ? {
        $or: [
          { sizeName: { $regex: keyword, $options: 'i' } }, // Search in size name
        ],
      }
    : {};

  const query = { ...searchQuery };

  const sizes = await Size.find(query)
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const totalItems = await Size.countDocuments(query);
  const totalPages = Math.ceil(totalItems / limit);

  res.status(200).json({
    success: true,
    message: 'Sizes retrieved successfully',
    data: sizes,
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

// Create a new size
exports.createSize = asyncHandler(async (req, res) => {
  const { sizeName } = req.body;

  // Check if size already exists
  const existingSize = await Size.findOne({
    sizeName: sizeName.toLowerCase().trim(),
    isActive: true
  });

  if (existingSize) {
    return res.status(400).json({
      success: false,
      message: 'Size already exists',
    });
  }

  const size = await Size.create({
    sizeName: sizeName.toLowerCase().trim(),
  });

  res.status(201).json({
    success: true,
    message: 'Size created successfully',
    data: size,
  });
});

// Update a size
exports.updateSize = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { sizeName, isActive } = req.body;

  const size = await Size.findById(id);

  // If updating sizeName, check for duplicates
  if (sizeName && sizeName.toLowerCase().trim() !== size.sizeName) {
    const existingSize = await Size.findOne({
      sizeName: sizeName.toLowerCase().trim(),
      isActive: true,
      _id: { $ne: id }
    });
    if (existingSize) {
      return res.status(400).json({
        success: false,
        message: 'Size name already exists',
      });
    }
  }

  const updateData = {};
  if (sizeName) {
    updateData.sizeName = sizeName.toLowerCase().trim();
  }
  if (isActive !== undefined) {
    updateData.isActive = isActive;
  }

  const updatedSize = await Size.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    message: 'Size updated successfully',
    data: updatedSize,
  });
});

// Delete a size
exports.deleteSize = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const size = await Size.findById(id);
  if (!size) {
    return res.status(404).json({
      success: false,
      message: 'Size not found',
    });
  }

  await Size.findByIdAndDelete(id);

  res.status(200).json({
    success: true,
    message: 'Size deleted successfully',
  });
});

// Get size by ID
exports.getSizeById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const size = await Size.findOne({ _id: id });

  if (!size) {
    return res.status(404).json({
      success: false,
      message: 'Size not found',
    });
  }

  res.status(200).json({
    success: true,
    message: 'Size retrieved successfully',
    data: size,
  });
});

// Get sizes for a specific product (from product's quantity array)
exports.getSizesByProduct = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  // Check if product exists and is not deleted
  const product = await Product.findOne({ _id: productId, isDeleted: false });
  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found',
    });
  }

  // Return the quantity array from product
  res.status(200).json({
    success: true,
    message: 'Sizes retrieved successfully',
    data: product.quantity || [],
  });
});

// Get available sizes for a product (public endpoint - only sizes with quantity > 0)
exports.getAvailableSizes = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const product = await Product.findOne({ _id: productId, isDeleted: false });
  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found',
    });
  }

  // Filter to only show sizes with quantity > 0
  const availableSizes = (product.quantity || []).filter(item => item.no > 0);

  res.status(200).json({
    success: true,
    message: 'Available sizes retrieved successfully',
    data: availableSizes,
  });
});
