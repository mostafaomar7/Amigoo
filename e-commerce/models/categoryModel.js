const mongoose = require('mongoose');
// 1- Create Schema
const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'اسم الفئة مطلوب'],
      unique: [true, 'اسم الفئة يجب أن يكون فريداً'],
      minlength: [3, 'اسم الفئة قصير جداً'],
      maxlength: [32, 'اسم الفئة طويل جداً'],
    },
    // A and B => shoping.com/a-and-b
    slug: {
      type: String,
      lowercase: true,
    },
    image: {
      type: String,
      required: [true, 'صورة الفئة مطلوبة']
    },
    isDeleted: {
      type: Boolean,
      default: false,
    }
  },
  { timestamps: true }
);


// 2- Create model
const CategoryModel = mongoose.model('Category', categorySchema);

module.exports = CategoryModel;