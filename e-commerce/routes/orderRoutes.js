const express = require("express");

const router = express.Router();
const {
    createOrder,
    getAllOrders,
    getOrderById,
    updateOrderById,
    deleteOrderById,
} = require("../services/orderService");
const { validateOrder } = require("../utils/validators/validateOrder");
const {authenticate,authorize} =require("../middlewares/authMW")


router.route('/').get(authenticate,authorize(['Admin']),getAllOrders).post(validateOrder,createOrder);
router
  .route('/:id')
  .get(authenticate,authorize(['Admin']),getOrderById)
  .put(authenticate,authorize(['Admin']),validateOrder,updateOrderById)
  .delete(authenticate,authorize(['Admin']),deleteOrderById);

module.exports = router;

