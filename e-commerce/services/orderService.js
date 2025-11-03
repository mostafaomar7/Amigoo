const Order = require("../models/orderModel");
const Product = require("../models/productModel");
const Size = require("../models/sizeModel");
const Settings = require("../models/settingsModel");
const asyncHandler = require('express-async-handler');
const { v4: uuidv4 } = require('uuid');

// Generate unique order number
const generateOrderNumber = () => {
  return `ORD-${Date.now()}-${uuidv4().substring(0, 8).toUpperCase()}`;
};

// Create new order with size-based system
exports.createOrder = asyncHandler(async (req, res) => {
  const { items, shippingAddress, orderNotes } = req.body;
  const userId = req.user ? req.user.id : null;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Order items are required',
    });
  }

  // Validate and calculate order totals
  let totalAmount = 0;
  const validatedItems = [];

  for (const item of items) {
    const { productId, sizeName, quantity } = item;

    // Check if product exists and is not deleted
    const product = await Product.findOne({ _id: productId, isDeleted: false });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Product with ID ${productId} not found`,
      });
    }

    // Check if size exists and has sufficient stock
    const size = await Size.findOne({
      productId,
      sizeName: sizeName.toUpperCase(),
      isActive: true,
    });

    if (!size) {
      return res.status(400).json({
        success: false,
        message: `Size ${sizeName} not available for product ${product.title}`,
      });
    }

    if (size.quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock for ${product.title} - Size ${sizeName}. Available: ${size.quantity}`,
      });
    }

    const itemTotal = product.price * quantity;
    totalAmount += itemTotal;

    validatedItems.push({
      productId,
      sizeName: sizeName.toUpperCase(),
      quantity,
      price: product.price,
      totalPrice: itemTotal,
    });
  }

  // Get shipping cost from settings
  const settings = await Settings.getSettings();
  let shippingCost = 0;
  if (totalAmount < settings.free_shipping_threshold) {
    shippingCost = settings.shipping_cost;
  }

  const finalAmount = totalAmount + shippingCost;

  // Create order
  const orderData = {
    userId,
    orderNumber: generateOrderNumber(),
    status: 'pending',
    items: validatedItems,
    totalAmount,
    shippingCost,
    finalAmount,
    ...shippingAddress,
    orderNotes,
  };

  const order = await Order.create(orderData);

  // Update stock quantities
  for (const item of validatedItems) {
    await Size.findOneAndUpdate(
      { productId: item.productId, sizeName: item.sizeName },
      { $inc: { quantity: -item.quantity } }
    );
  }

  res.status(201).json({
    success: true,
    message: 'Order created successfully',
    data: order,
  });
});

// Get all orders (admin only)
exports.getAllOrders = asyncHandler(async (req, res) => {
  const { page: pageQuery, limit: limitQuery, keyword: keywordQuery, status } = req.query;
  const page = pageQuery * 1 || 1;
  const limit = limitQuery * 1 || 10;
  const skip = (page - 1) * limit;
  const keyword = keywordQuery || '';

  const searchQuery = keyword
    ? {
        $or: [
          { orderNumber: { $regex: keyword, $options: 'i' } }, // Search in order number
          { fullName: { $regex: keyword, $options: 'i' } }, // Search in full name
          { email: { $regex: keyword, $options: 'i' } }, // Search in email
          { phone: { $regex: keyword, $options: 'i' } }, // Search in phone
        ],
      }
    : {};

  const filter = status ? { ...searchQuery, status } : { ...searchQuery };

  const orders = await Order.find(filter)
    .populate('userId', 'name email')
    .populate('items.productId', 'title imageCover')
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const totalItems = await Order.countDocuments(filter);
  const totalPages = Math.ceil(totalItems / limit);

  res.status(200).json({
    success: true,
    message: 'Orders retrieved successfully',
    data: orders,
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

// Get order by ID
exports.getOrderById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const order = await Order.findById(id)
    .populate('userId', 'name email')
    .populate('items.productId', 'title imageCover description');

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found',
    });
  }

  res.status(200).json({
    success: true,
    message: 'Order retrieved successfully',
    data: order,
  });
});

// Update order status (admin only)
exports.updateOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['pending', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid status. Must be one of: pending, completed, cancelled',
    });
  }

  const order = await Order.findByIdAndUpdate(
    id,
    { status },
    { new: true, runValidators: true }
  ).populate('userId', 'name email')
   .populate('items.productId', 'title imageCover');

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found',
    });
  }

  // If order is cancelled, restore stock
  if (status === 'cancelled' && order.status !== 'cancelled') {
    for (const item of order.items) {
      await Size.findOneAndUpdate(
        { productId: item.productId, sizeName: item.sizeName },
        { $inc: { quantity: item.quantity } }
      );
    }
  }

  res.status(200).json({
    success: true,
    message: 'Order status updated successfully',
    data: order,
  });
});

// Get user's orders
exports.getUserOrders = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 10;
  const skip = (page - 1) * limit;

  const orders = await Order.find({ userId })
    .populate('items.productId', 'title imageCover')
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const totalItems = await Order.countDocuments({ userId });
  const totalPages = Math.ceil(totalItems / limit);

  res.status(200).json({
    success: true,
    message: 'User orders retrieved successfully',
    data: orders,
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

// Delete order (admin only)
exports.deleteOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const order = await Order.findByIdAndDelete(id);

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found',
    });
  }

  // Restore stock if order was not cancelled
  if (order.status !== 'cancelled') {
    for (const item of order.items) {
      await Size.findOneAndUpdate(
        { productId: item.productId, sizeName: item.sizeName },
        { $inc: { quantity: item.quantity } }
      );
    }
  }

  res.status(200).json({
    success: true,
    message: 'Order deleted successfully',
  });
});

// Get order statistics (admin only)
exports.getOrderStats = asyncHandler(async (req, res) => {
  const totalOrders = await Order.countDocuments();
  const pendingOrders = await Order.countDocuments({ status: 'pending' });
  const processingOrders = await Order.countDocuments({ status: 'processing' });
  const deliveredOrders = await Order.countDocuments({ status: 'delivered' });
  const cancelledOrders = await Order.countDocuments({ status: 'cancelled' });

  const totalRevenue = await Order.aggregate([
    { $match: { status: { $ne: 'cancelled' } } },
    { $group: { _id: null, total: { $sum: '$finalAmount' } } }
  ]);

  res.status(200).json({
    success: true,
    message: 'Order statistics retrieved successfully',
    data: {
      totalOrders,
      pendingOrders,
      processingOrders,
      deliveredOrders,
      cancelledOrders,
      totalRevenue: (totalRevenue[0] && totalRevenue[0].total) || 0,
    },
  });
});
