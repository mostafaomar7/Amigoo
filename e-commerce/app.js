const path = require('path');
const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const cors = require('cors');

dotenv.config({ path: 'config.env' });
const dbConnection = require('./config/database');
const categoryRoute = require('./routes/categoryRoute');
const productRoute = require('./routes/productRouter');
const userRoute = require('./routes/userRoute');
const submitForm = require('./routes/contactFormRoutes');
const OrderForm = require('./routes/orderRoutes');

const corsOptions = {
  origin: "http://localhost:4200", // اسم الدومين الخاص بالفرونت
  methods: ["GET", "POST", "PUT", "DELETE"], // الطرق المسموح بها
  credentials: true, // السماح بإرسال الكوكيز أو الـ Authorization headers
};


// Connect with db
dbConnection();

// express app
const app = express();
app.use(cors(corsOptions)); // تفعيل الـ CORS

// Middlewares
app.use(express.json());
app.use('/uploads' , express.static(path.join(__dirname,"uploads")));


if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
  console.log(`mode: ${process.env.NODE_ENV}`);
}

// Mount Routes
app.use('/api/v1/categories', categoryRoute);
app.use('/api/v1/product', productRoute);
app.use('/api/v1/user', userRoute);
app.use('/api/v1/submit', submitForm);
app.use('/api/v1/Order', OrderForm);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`App running running on port ${PORT}`); 
});