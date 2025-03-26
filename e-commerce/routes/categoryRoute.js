const express = require('express');
const {authenticate,authorize} =require("../middlewares/authMW")

const { getCategories,CreatCategories,getCategory,updateCategory,deleteCategory,uploadCategoryImage} = require('../services/categoryService');
// const t = require('../services/categoryService');

const router = express.Router();

router.route("/").get(getCategories).post(authenticate,authorize(['Admin']),uploadCategoryImage,CreatCategories);
router.route("/:id").get(getCategory).delete(authenticate,authorize(['Admin']),deleteCategory).put(authenticate,authorize(['Admin']),uploadCategoryImage,updateCategory);

module.exports = router;
