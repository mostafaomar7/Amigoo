const express = require('express');
const {
    getProductValidator,
    createProductValidator,
    updateProductValidator,
    deleteProductValidator,
} = require('../utils/validators/productValidator');
const {authenticate,authorize} =require("../middlewares/authMW")
const {processFormData} = require('../middlewares/processFormData');

const {
    getProducts,
    getproduct,
    CreatProducts,
    updateProduct,
    deleteProduct,
    resizeProductImages,
    uploadProductImages,
    getProductsByCategory
} = require('../services/productService');

const router = express.Router();

router.route('/category/:categoryId').get(getProductsByCategory)
router.route('/').get(getProducts).post(authenticate,authorize(['Admin']),uploadProductImages,resizeProductImages,processFormData,createProductValidator,CreatProducts);
router
  .route('/:id')
  .get(getProductValidator,getproduct)
  .put(authenticate,authorize(['Admin']), uploadProductImages,resizeProductImages,processFormData,updateProductValidator,updateProduct)
  .delete(authenticate,authorize(['Admin']), deleteProductValidator,deleteProduct);

module.exports = router;
