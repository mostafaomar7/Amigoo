const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: 'config.env' });

const User = require('./models/User');

const freshSeedAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.DB_URL);
    console.log('✓ Connected to MongoDB');

    // Get all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`\n🗑️  Found ${collections.length} collections to drop...`);

    // Drop all collections
    for (const collection of collections) {
      await mongoose.connection.db.dropCollection(collection.name);
      console.log(`  ✓ Dropped collection: ${collection.name}`);
    }

    console.log('\n✅ All collections dropped successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 12);

    const adminUser = new User({
      name: 'Admin User',
      email: 'admin@gmail.com',
      password: hashedPassword,
      role: 'Admin'
    });

    await adminUser.save();

    console.log('\n✅ Admin account created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Email: admin@gmail.com');
    console.log('Password: admin123');
    console.log('Role: Admin');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    await mongoose.connection.close();
    console.log('✓ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

freshSeedAdmin();
