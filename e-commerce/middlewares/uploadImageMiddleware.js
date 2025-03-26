const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/config/cloudinary');

// إعدادات التخزين في Cloudinary
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'uploads', // يمكن تغييره حسب نوع الصور
    format: async () => 'jpeg' },
});

// مرشح الملفات للسماح فقط بالصور
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new Error('Only Images allowed', 400), false);
  }
};

const upload = multer({ storage, fileFilter });

exports.uploadSingleImage = (fieldName) => upload.single(fieldName);

exports.uploadMixOfImages = (arrayOfFields) => upload.fields(arrayOfFields);
