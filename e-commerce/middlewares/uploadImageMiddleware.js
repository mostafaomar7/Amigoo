const multer = require('multer');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const multerOptions = () => {
  const multerStorage = multer.memoryStorage();

  const multerFilter = function (req, file, cb) {
    if (file.mimetype.startsWith('image')) {
      cb(null, true);
    } else {
      cb(new Error('Only Images allowed', 400), false);
    }
  };

  const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

  return upload;
};

exports.uploadSingleImage = (fieldName) => multerOptions().single(fieldName);

exports.uploadMixOfImages = (arrayOfFields) => multerOptions().fields(arrayOfFields);

// Middleware to convert images to WEBP format
exports.convertToWebP = async (req, res, next) => {
  try {
    if (req.files) {
      // Handle single file uploads
      if (req.file) {
        const webpFileName = `image-${uuidv4()}-${Date.now()}.webp`;
        const outputPath = path.join(__dirname, '..', 'uploads', webpFileName);

        await sharp(req.file.buffer)
          .resize({ width: 2000, withoutEnlargement: true })
          .webp({ quality: 90 })
          .toFile(outputPath);

        req.file.filename = webpFileName;
        req.file.path = outputPath;
      }

      // Handle multiple file uploads
      for (const fieldName in req.files) {
        if (req.files[fieldName]) {
          const files = Array.isArray(req.files[fieldName]) ? req.files[fieldName] : [req.files[fieldName]];

          for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const webpFileName = `image-${uuidv4()}-${Date.now()}-${i}.webp`;
            const outputPath = path.join(__dirname, '..', 'uploads', webpFileName);

            await sharp(file.buffer)
              .resize({ width: 2000, withoutEnlargement: true })
              .webp({ quality: 90 })
              .toFile(outputPath);

            file.filename = webpFileName;
            file.path = outputPath;
          }
        }
      }
    }
    next();
  } catch (error) {
    next(error);
  }
};

// Middleware for category images
exports.convertCategoryImage = async (req, res, next) => {
  try {
    if (req.file) {
      const webpFileName = `category-${uuidv4()}-${Date.now()}.webp`;
      const outputPath = path.join(__dirname, '..', 'uploads', 'category', webpFileName);

      await sharp(req.file.buffer)
        .resize({ width: 800, height: 600, fit: 'cover' })
        .webp({ quality: 85 })
        .toFile(outputPath);

      req.file.filename = webpFileName;
      req.file.path = outputPath;
    }
    next();
  } catch (error) {
    next(error);
  }
};

// Middleware for product images
exports.convertProductImages = async (req, res, next) => {
  try {
    if (req.files) {
      // Handle cover image
      if (req.files.imageCover) {
        const webpFileName = `product-${uuidv4()}-${Date.now()}-cover.webp`;
        const outputPath = path.join(__dirname, '..', 'uploads', 'products', webpFileName);

        await sharp(req.files.imageCover[0].buffer)
          .resize({ width: 2000, withoutEnlargement: true })
          .webp({ quality: 90 })
          .toFile(outputPath);

        req.files.imageCover[0].filename = webpFileName;
        req.files.imageCover[0].path = outputPath;
      }

      // Handle additional images
      if (req.files.images) {
        for (let i = 0; i < req.files.images.length; i++) {
          const webpFileName = `product-${uuidv4()}-${Date.now()}-${i + 1}.webp`;
          const outputPath = path.join(__dirname, '..', 'uploads', 'products', webpFileName);

          await sharp(req.files.images[i].buffer)
            .resize({ width: 2000, withoutEnlargement: true })
            .webp({ quality: 90 })
            .toFile(outputPath);

          req.files.images[i].filename = webpFileName;
          req.files.images[i].path = outputPath;
        }
      }
    }
    next();
  } catch (error) {
    next(error);
  }
};