const path = require('path');
const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const cors = require('cors');

dotenv.config({ path: 'config.env' });
const dbConnection = require('./config/database');
const errorHandler = require('./middlewares/errorHandler');
const categoryRoute = require('./routes/categoryRoute');
const productRoute = require('./routes/productRouter');
const userRoute = require('./routes/userRoute');
const submitForm = require('./routes/contactFormRoutes');
const OrderForm = require('./routes/orderRoutes');
const sizeRoutes = require('./routes/sizeRoutes');
const settingsRoutes = require('./routes/settingsRoutes');

const corsOptions = {
  origin: ["https://amigo.mosalam.com", "http://localhost:3000","http://localhost:4200","http://192.168.0.107:4200"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
};

dbConnection();

const app = express();
app.use(cors(corsOptions));

app.use(express.json());
app.use('/uploads' , express.static(path.join(__dirname,"uploads")));


if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
  console.log(`mode: ${process.env.NODE_ENV}`);
}

app.use('/api/v1/categories', categoryRoute);
app.use('/api/v1/product', productRoute);
app.use('/api/v1/user', userRoute);
app.use('/api/v1/submit', submitForm);
app.use('/api/v1/Order', OrderForm);
app.use('/api/v1/sizes', sizeRoutes);
app.use('/api/v1/settings', settingsRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`App running running on port ${PORT}`);
});
