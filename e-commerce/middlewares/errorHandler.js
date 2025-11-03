const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error for debugging
  console.error(err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'المورد غير موجود';
    error = { message, statusCode: 404 };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const fieldNames = {
      'name': 'الاسم',
      'email': 'البريد الإلكتروني',
      'slug': 'الرابط',
      'title': 'العنوان'
    };
    const fieldName = fieldNames[field] || field;
    const message = `${fieldName} يجب أن يكون فريداً`;
    error = { message, statusCode: 400 };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = { message, statusCode: 400 };
  }

  // Mongoose duplicate key error (alternative handling)
  if (err.name === 'MongooseError' && err.message.includes('must be unique')) {
    const field = err.message.split(' ')[0];
    const fieldNames = {
      'Category': 'الفئة',
      'Product': 'المنتج',
      'User': 'المستخدم'
    };
    const fieldName = fieldNames[field] || field;
    const message = `${fieldName} يجب أن يكون فريداً`;
    error = { message, statusCode: 400 };
  }

  const response = {
    success: false,
    message: error.message || 'خطأ في الخادم'
  };

  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(error.statusCode || 500).json(response);
};

module.exports = errorHandler;
