const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { v4: uuidv4 } = require('uuid');

// Load environment variables
dotenv.config({ path: 'config.env' });

const Order = require('./models/orderModel');
const Product = require('./models/productModel');
const User = require('./models/User');
const Settings = require('./models/settingsModel');
const Category = require('./models/categoryModel');
const bcrypt = require('bcryptjs');

// Generate unique order number
const generateOrderNumber = () => {
  return `ORD-${Date.now()}-${uuidv4().substring(0, 8).toUpperCase()}`;
};

// Sample data for generating orders
const firstNames = [
  'Ahmed', 'Mohamed', 'Ali', 'Omar', 'Hassan', 'Khaled', 'Mahmoud', 'Ibrahim',
  'Youssef', 'Amr', 'Tarek', 'Waleed', 'Karim', 'Nader', 'Samy', 'Fady',
  'Sherif', 'Maged', 'Osama', 'Ammar', 'Bassem', 'Diaa', 'Eslam', 'Farouk'
];

const lastNames = [
  'Ali', 'Hassan', 'Ibrahim', 'Mohamed', 'Ahmed', 'Mahmoud', 'Salem', 'Fawzy',
  'Saleh', 'Nagy', 'Farouk', 'Taha', 'Samy', 'Youssef', 'Amr', 'Omar'
];

const streets = [
  'Tahrir Square', 'Nasr City', 'Maadi', 'Zamalek', 'Heliopolis', 'New Cairo',
  '6th October', 'Sheikh Zayed', 'Mokattam', 'Dokki', 'Giza', 'Alexandria',
  'Sharm El Sheikh', 'Hurghada', 'Luxor', 'Aswan'
];

const states = [
  'Cairo', 'Giza', 'Alexandria', 'North Sinai', 'South Sinai', 'Red Sea',
  'Luxor', 'Aswan', 'Qena', 'Sohag', 'Asyut', 'Minya', 'Beni Suef'
];

const countries = ['Egypt', 'Saudi Arabia', 'UAE', 'Kuwait', 'Qatar', 'Jordan'];

const orderStatuses = ['pending', 'completed', 'cancelled'];

const orderNotes = [
  'Please deliver before 5 PM',
  'Call before delivery',
  'Leave at front door',
  'Ring the bell twice',
  'Delivery to reception',
  null,
  null,
  null,
  null
];

// Generate random name
const getRandomName = () => {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  return `${firstName} ${lastName}`;
};

// Generate random email
const getRandomEmail = (name) => {
  const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
  const domain = domains[Math.floor(Math.random() * domains.length)];
  const namePart = name.toLowerCase().replace(/\s+/g, '.');
  const randomNum = Math.floor(Math.random() * 1000);
  return `${namePart}.${randomNum}@${domain}`;
};

// Generate random phone (11 digits)
const getRandomPhone = () => {
  return Math.floor(10000000000 + Math.random() * 90000000000).toString();
};

// Generate random street address
const getRandomAddress = () => {
  const street = streets[Math.floor(Math.random() * streets.length)];
  const building = Math.floor(Math.random() * 200) + 1;
  const floor = Math.floor(Math.random() * 10) + 1;
  const apartment = Math.floor(Math.random() * 50) + 1;
  return `${building} ${street} St., Floor ${floor}, Apt ${apartment}`;
};

// Create test users if they don't exist
const createTestUsers = async (count = 10) => {
  const users = [];
  const existingUsers = await User.find().limit(count);

  if (existingUsers.length >= count) {
    return existingUsers;
  }

  const needed = count - existingUsers.length;
  const hashedPassword = await bcrypt.hash('test123', 12);

  for (let i = 0; i < needed; i++) {
    const name = getRandomName();
    const email = getRandomEmail(name);

    // Check if user already exists
    const exists = await User.findOne({ email });
    if (!exists) {
      const user = await User.create({
        name,
        email,
        password: hashedPassword,
        role: 'user'
      });
      users.push(user);
    }
  }

  return [...existingUsers, ...users];
};

const seedOrders = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.DB_URL);
    console.log('✓ Connected to MongoDB');

    // Get existing products
    const products = await Product.find({ isDeleted: false });
    if (products.length === 0) {
      console.log('❌ No products found in database. Please create products first.');
      await mongoose.connection.close();
      process.exit(1);
    }
    console.log(`✓ Found ${products.length} products`);

    // Get or create test users
    const users = await createTestUsers(10);
    console.log(`✓ Using ${users.length} users`);

    // Get settings for shipping calculation
    let settings;
    try {
      settings = await Settings.getSettings();
    } catch (e) {
      settings = { free_shipping_threshold: 500, shipping_cost: 50 };
    }

    // Delete existing orders (optional - comment out if you want to keep them)
    // await Order.deleteMany({});
    // console.log('✓ Cleared existing orders');

    // Generate 50 orders
    const orders = [];
    const orderCount = 50;

    for (let i = 0; i < orderCount; i++) {
      // Random user
      const user = users[Math.floor(Math.random() * users.length)];

      // Random number of items (1-3)
      const itemCount = Math.floor(Math.random() * 3) + 1;
      const items = [];
      let totalAmount = 0;

      // Generate items
      for (let j = 0; j < itemCount; j++) {
        const product = products[Math.floor(Math.random() * products.length)];

        // Get available sizes from product quantity array
        const availableSizes = product.quantity || [];
        if (availableSizes.length === 0) continue;

        const sizeObj = availableSizes[Math.floor(Math.random() * availableSizes.length)];
        const sizeName = sizeObj.size.toUpperCase();
        const maxQuantity = Math.min(sizeObj.no || 1, 5); // Max 5 items per order
        const quantity = Math.floor(Math.random() * maxQuantity) + 1;

        const price = product.price || 100;
        const totalPrice = price * quantity;
        totalAmount += totalPrice;

        items.push({
          productId: product._id,
          sizeName: sizeName,
          quantity: quantity,
          price: price,
          totalPrice: totalPrice,
        });
      }

      if (items.length === 0) continue;

      // Calculate shipping
      const shippingCost = totalAmount < settings.free_shipping_threshold
        ? settings.shipping_cost
        : 0;
      const finalAmount = totalAmount + shippingCost;

      // Generate customer info
      const fullName = getRandomName();
      const email = getRandomEmail(fullName);
      const phone = getRandomPhone();
      const country = countries[Math.floor(Math.random() * countries.length)];
      const state = states[Math.floor(Math.random() * states.length)];
      const streetAddress = getRandomAddress();
      const status = orderStatuses[Math.floor(Math.random() * orderStatuses.length)];
      const note = orderNotes[Math.floor(Math.random() * orderNotes.length)];

      // Create order
      const orderData = {
        userId: user._id,
        orderNumber: generateOrderNumber(),
        status: status,
        items: items,
        totalAmount: totalAmount,
        shippingCost: shippingCost,
        finalAmount: finalAmount,
        fullName: fullName,
        country: country,
        streetAddress: streetAddress,
        state: state,
        phone: phone,
        email: email,
        shippingAddress: Math.random() > 0.5,
        orderNotes: note,
      };

      // Add small delay to ensure unique timestamps for order numbers
      await new Promise(resolve => setTimeout(resolve, 10));

      const order = await Order.create(orderData);
      orders.push(order);

      if ((i + 1) % 10 === 0) {
        console.log(`✓ Created ${i + 1}/${orderCount} orders`);
      }
    }

    console.log('\n✅ Successfully created 50 orders!');
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`Total orders created: ${orders.length}`);

    // Show statistics
    const pending = orders.filter(o => o.status === 'pending').length;
    const completed = orders.filter(o => o.status === 'completed').length;
    const cancelled = orders.filter(o => o.status === 'cancelled').length;
    const totalRevenue = orders
      .filter(o => o.status !== 'cancelled')
      .reduce((sum, o) => sum + o.finalAmount, 0);

    console.log(`Status breakdown:`);
    console.log(`  - Pending: ${pending}`);
    console.log(`  - Completed: ${completed}`);
    console.log(`  - Cancelled: ${cancelled}`);
    console.log(`Total Revenue: ${totalRevenue.toFixed(2)} EGP`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding orders:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

seedOrders();
