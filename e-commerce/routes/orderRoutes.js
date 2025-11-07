const express = require("express");

const router = express.Router();
const {
    createOrder,
    getAllOrders,
    getOrderById,
    updateOrderStatus,
    deleteOrder,
    getUserOrders,
    getOrderStats,
    getOrderStatusesBreakdown,
} = require("../services/orderService");
const { validateOrder } = require("../utils/validators/validateOrder");
const {authenticate,authorize} =require("../middlewares/authMW")

// Public routes
router.route('/').post(validateOrder, createOrder);

// Protected routes
router.use(authenticate);

// User routes
router.route('/my-orders').get(getUserOrders);
router.route('/:id/cancel').put(updateOrderStatus); // User can cancel their own orders

// Admin routes
router.use(authorize(['Admin']));

router.route('/').get(getAllOrders);
router.route('/stats').get(getOrderStats);
router.route('/statuses-breakdown').get(getOrderStatusesBreakdown);
router.route('/:id').get(getOrderById);
router.route('/:id/status').put(updateOrderStatus);
router.route('/:id').delete(deleteOrder);

module.exports = router;
