const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: [3, 'Too short product title'],
      maxlength: [100, 'Too long product title'],
    },
    slug: {
      type: String,
      required: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: [true, 'وصف المنتج مطلوب'],
      minlength: [5, 'Too short product description'],
    },
    sold: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      trim: true,
      max: [100000, 'Too long product price'],
    },
    priceAfterDiscount: {
      type: Number,
    },
    colors: [String],
    imageCover: {
      type: String,
      required: [true, 'Product Image cover is required'],
    },
    images: [String],
    category: {
      type: mongoose.Schema.ObjectId,
      ref: 'Category',
      required: [true, 'Product must be belong to category'],
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    quantity: [
      {
        size: {
          type: String,
          required: true,
          lowercase: true,
          trim: true,
        },
        no: {
          type: Number,
          required: true,
          min: [0, 'Quantity cannot be negative'],
          default: 0,
        },
      },
    ],
  },
  { timestamps: true }
);

// Pre-save hook to normalize size names in quantity array
productSchema.pre('save', function(next) {
  if (this.quantity && Array.isArray(this.quantity)) {
    this.quantity.forEach((item) => {
      if (item.size) {
        item.size = item.size.toLowerCase().trim();
      }
    });
  }
  next();
});

// Mongoose query middleware
productSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'category',
    select: 'name -_id',
  });
  next();
});

module.exports = mongoose.model('Product', productSchema);
