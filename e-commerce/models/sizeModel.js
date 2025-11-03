const mongoose = require('mongoose');

const sizeSchema = new mongoose.Schema(
  {
    sizeName: {
      type: String,
      required: [true, 'Size name is required'],
      trim: true,
      lowercase: true,
      unique: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Pre-save hook to convert sizeName to lowercase
sizeSchema.pre('save', function(next) {
  if (this.sizeName) {
    this.sizeName = this.sizeName.toLowerCase().trim();
  }
  next();
});

// Index for active sizes
sizeSchema.index({ isActive: 1 });

module.exports = mongoose.model('Size', sizeSchema);
