const Order = require("../models/orderModel");
const Product = require("../models/productModel");
const Size = require("../models/sizeModel");
const User = require("../models/User");
const Settings = require("../models/settingsModel");
const asyncHandler = require('express-async-handler');
const { v4: uuidv4 } = require('uuid');

// Generate unique order number
const generateOrderNumber = () => {
  return `ORD-${Date.now()}-${uuidv4().substring(0, 8).toUpperCase()}`;
};

/**
 * Validate cart items - prevent duplicates and invalid products
 * Returns array of unique product+size combinations
 */
const validateCartItems = (items) => {
  const seen = new Set();
  const uniqueItems = [];

  for (const item of items) {
    // Create unique key: productId + sizeName
    const key = `${item.productId}-${(item.sizeName || '').toLowerCase()}`;

    if (seen.has(key)) {
      throw new Error(`Duplicate product detected: Product ${item.productId} with size ${item.sizeName} is already in cart`);
    }

    seen.add(key);
    uniqueItems.push(item);
  }

  return uniqueItems;
};

/**
 * Validate stock availability from product's quantity array
 */
const validateStockFromProduct = (product, sizeName, requestedQuantity) => {
  if (!product.quantity || !Array.isArray(product.quantity)) {
    return { available: 0, valid: false };
  }

  const sizeEntry = product.quantity.find(
    q => q.size && q.size.toLowerCase() === sizeName.toLowerCase()
  );

  if (!sizeEntry) {
    return { available: 0, valid: false };
  }

  const available = sizeEntry.no || 0;
  return {
    available,
    valid: available >= requestedQuantity
  };
};

// Create new order with comprehensive validation
exports.createOrder = asyncHandler(async (req, res) => {
  const { items, shippingAddress, orderNotes, totalAmount: clientTotalAmount } = req.body;
  const userId = req.user ? req.user.id : null;

  // Validation 1: Prevent empty cart
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Cart is empty. Cannot create order without items.',
    });
  }

  // Validation 2: Prevent duplicate products
  let uniqueItems;
  try {
    uniqueItems = validateCartItems(items);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  // Validation 3: Validate user exists (if authenticated)
  if (userId) {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found. Please login again.',
      });
    }
  }

  // Validation 4: Validate shipping address exists
  if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.streetAddress ||
      !shippingAddress.country || !shippingAddress.state) {
    return res.status(400).json({
      success: false,
      message: 'Shipping address is required. Please provide fullName, streetAddress, country, and state.',
    });
  }

  // Validate and calculate order totals
  let calculatedTotalAmount = 0;
  const validatedItems = [];
  const productIds = new Set();

  for (const item of items) {
    const { productId, sizeName, quantity } = item;

    // Validation 5: Validate required fields
    if (!productId || !quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Invalid item: productId and quantity (min 1) are required',
      });
    }

    // Validation 6: Check if product exists and is not deleted
    const product = await Product.findOne({ _id: productId, isDeleted: false });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Product with ID ${productId} not found or has been deleted`,
      });
    }

    // Validation 7: Check stock availability
    // Try Size model first (if it has productId field), otherwise use product.quantity array
    let stockAvailable = false;
    let availableStock = 0;

    if (sizeName) {
      // Try to find size in Size model (if it supports productId)
      try {
        const size = await Size.findOne({
          productId,
          sizeName: sizeName.toLowerCase(),
          isActive: true,
        });

        if (size && size.quantity !== undefined) {
          availableStock = size.quantity;
          stockAvailable = size.quantity >= quantity;
        } else {
          // Fallback to product's quantity array
          const stockCheck = validateStockFromProduct(product, sizeName, quantity);
          availableStock = stockCheck.available;
          stockAvailable = stockCheck.valid;
        }
      } catch (error) {
        // If Size model doesn't support productId, use product.quantity array
        const stockCheck = validateStockFromProduct(product, sizeName, quantity);
        availableStock = stockCheck.available;
        stockAvailable = stockCheck.valid;
      }
    } else {
      // No size specified - check total quantity across all sizes
      const totalStock = (product.quantity || []).reduce((sum, q) => sum + (q.no || 0), 0);
      availableStock = totalStock;
      stockAvailable = totalStock >= quantity;
    }

    if (!stockAvailable) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock for ${product.title}${sizeName ? ` - Size ${sizeName}` : ''}. Available: ${availableStock}, Requested: ${quantity}`,
      });
    }

    // Calculate item price (use priceAfterDiscount if available, otherwise regular price)
    const itemPrice = product.priceAfterDiscount || product.price;
    const itemTotal = itemPrice * quantity;
    calculatedTotalAmount += itemTotal;

    validatedItems.push({
      productId,
      sizeName: sizeName ? sizeName.toUpperCase() : undefined,
      quantity,
      price: itemPrice,
      totalPrice: itemTotal,
    });

    productIds.add(productId.toString());
  }

  // Validation 8: Validate total price = sum of items × quantity
  // Get shipping cost from settings
  const settings = await Settings.getSettings();
  let shippingCost = 0;
  if (calculatedTotalAmount < settings.free_shipping_threshold) {
    shippingCost = settings.shipping_cost || 0;
  }

  const calculatedFinalAmount = calculatedTotalAmount + shippingCost;

  // If client sent totalAmount, validate it matches calculated amount (allow small rounding differences)
  if (clientTotalAmount !== undefined) {
    const difference = Math.abs(clientTotalAmount - calculatedFinalAmount);
    if (difference > 0.01) { // Allow 1 cent difference for rounding
      return res.status(400).json({
        success: false,
        message: `Price mismatch: Calculated total (${calculatedFinalAmount.toFixed(2)}) does not match provided total (${clientTotalAmount.toFixed(2)})`,
        calculatedTotal: calculatedFinalAmount,
        providedTotal: clientTotalAmount,
      });
    }
  }

  // Create order
  const orderData = {
    userId,
    orderNumber: generateOrderNumber(),
    status: 'pending',
    items: validatedItems,
    totalAmount: calculatedTotalAmount,
    shippingCost,
    finalAmount: calculatedFinalAmount,
    ...shippingAddress,
    orderNotes,
  };

  const order = await Order.create(orderData);

  // Update stock quantities - try Size model first, then product.quantity array
  for (const item of validatedItems) {
    if (item.sizeName) {
      try {
        // Try Size model update
        const sizeUpdate = await Size.findOneAndUpdate(
          { productId: item.productId, sizeName: item.sizeName.toLowerCase() },
          { $inc: { quantity: -item.quantity } },
          { new: true }
        );

        // If Size model doesn't have the record, update product.quantity array
        if (!sizeUpdate) {
          const product = await Product.findById(item.productId);
          if (product && product.quantity) {
            const sizeIndex = product.quantity.findIndex(
              q => q.size && q.size.toLowerCase() === item.sizeName.toLowerCase()
            );
            if (sizeIndex !== -1 && product.quantity[sizeIndex].no >= item.quantity) {
              product.quantity[sizeIndex].no -= item.quantity;
              await product.save();
            }
          }
        }
      } catch (error) {
        // Fallback to product.quantity array
        const product = await Product.findById(item.productId);
        if (product && product.quantity) {
          const sizeIndex = product.quantity.findIndex(
            q => q.size && q.size.toLowerCase() === item.sizeName.toLowerCase()
          );
          if (sizeIndex !== -1 && product.quantity[sizeIndex].no >= item.quantity) {
            product.quantity[sizeIndex].no -= item.quantity;
            await product.save();
          }
        }
      }
    } else {
      // No size - update first available size or total
      const product = await Product.findById(item.productId);
      if (product && product.quantity && product.quantity.length > 0) {
        // Deduct from first available size
        for (const qty of product.quantity) {
          if (qty.no >= item.quantity) {
            qty.no -= item.quantity;
            break;
          }
        }
        await product.save();
      }
    }
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

/**
 * Restore stock when order is cancelled
 */
const restoreStock = async (items) => {
  for (const item of items) {
    if (item.sizeName) {
      try {
        // Try Size model first
        const sizeUpdate = await Size.findOneAndUpdate(
          { productId: item.productId, sizeName: item.sizeName.toLowerCase() },
          { $inc: { quantity: item.quantity } },
          { new: true }
        );

        // If Size model doesn't have the record, update product.quantity array
        if (!sizeUpdate) {
          const product = await Product.findById(item.productId);
          if (product && product.quantity) {
            const sizeIndex = product.quantity.findIndex(
              q => q.size && q.size.toLowerCase() === item.sizeName.toLowerCase()
            );
            if (sizeIndex !== -1) {
              product.quantity[sizeIndex].no += item.quantity;
              await product.save();
            }
          }
        }
      } catch (error) {
        // Fallback to product.quantity array
        const product = await Product.findById(item.productId);
        if (product && product.quantity) {
          const sizeIndex = product.quantity.findIndex(
            q => q.size && q.size.toLowerCase() === item.sizeName.toLowerCase()
          );
          if (sizeIndex !== -1) {
            product.quantity[sizeIndex].no += item.quantity;
            await product.save();
          }
        }
      }
    } else {
      // No size - restore to first available size
      const product = await Product.findById(item.productId);
      if (product && product.quantity && product.quantity.length > 0) {
        // Add to first size entry
        product.quantity[0].no += item.quantity;
        await product.save();
      }
    }
  }
};

// Update order status with cancellation validation
exports.updateOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const isUserRequest = req.user && req.user.role === 'user'; // Check if user (not admin) is making request

  const validStatuses = ['pending', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid status. Must be one of: pending, completed, cancelled',
    });
  }

  // Get order before update to check current status
  const existingOrder = await Order.findById(id)
    .populate('userId', 'name email')
    .populate('items.productId', 'title imageCover');

  if (!existingOrder) {
    return res.status(404).json({
      success: false,
      message: 'Order not found',
    });
  }

  // Validation: Cancelation rules
  if (status === 'cancelled') {
    // Rule 1: User can cancel only if status = pending
    if (isUserRequest && existingOrder.status !== 'pending') {
      return res.status(403).json({
        success: false,
        message: `Cannot cancel order. Order status is "${existingOrder.status}". Only pending orders can be cancelled by users.`,
      });
    }

    // Rule 2: Block cancellation if already confirmed or shipped (completed)
    if (existingOrder.status === 'completed') {
      return res.status(403).json({
        success: false,
        message: 'Cannot cancel order. Order has already been completed/shipped.',
      });
    }

    // Rule 3: Prevent duplicate cancellation
    if (existingOrder.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Order is already cancelled.',
      });
    }
  }

  // Update order status
  const order = await Order.findByIdAndUpdate(
    id,
    { status },
    { new: true, runValidators: true }
  ).populate('userId', 'name email')
   .populate('items.productId', 'title imageCover');

  // Rule 4: Cancelation restores product stock
  if (status === 'cancelled' && existingOrder.status !== 'cancelled') {
    await restoreStock(order.items);
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
  // Count orders by status
  const pendingOrders = await Order.countDocuments({ status: 'pending' });

  // Count completed orders - include all non-pending, non-cancelled statuses
  // This covers: 'completed', 'delivered', 'confirmed', 'shipped', etc.
  const completedOrders = await Order.countDocuments({
    status: {
      $nin: ['pending', 'cancelled']
    }
  });

  const cancelledOrders = await Order.countDocuments({ status: 'cancelled' });

  // Calculate total as sum of all status counts to ensure accuracy
  const totalOrders = pendingOrders + completedOrders + cancelledOrders;

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
      completedOrders,
      cancelledOrders,
      totalRevenue: (totalRevenue[0] && totalRevenue[0].total) || 0,
    },
  });
});

// Get all order statuses breakdown (for debugging)
exports.getOrderStatusesBreakdown = asyncHandler(async (req, res) => {
  // Get breakdown of all statuses in database
  const statusBreakdown = await Order.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);

  // Get total count
  const totalCount = await Order.countDocuments();

  // Format the response
  const statuses = statusBreakdown.map(item => ({
    status: item._id || 'null/undefined',
    count: item.count
  }));

  res.status(200).json({
    success: true,
    message: 'Order statuses breakdown retrieved successfully',
    data: {
      totalOrders: totalCount,
      statuses: statuses,
      summary: statusBreakdown.reduce((acc, item) => {
        acc[item._id || 'null'] = item.count;
        return acc;
      }, {})
    },
  });
});
