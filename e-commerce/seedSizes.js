const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: 'config.env' });

const Size = require('./models/sizeModel');

// Common clothing sizes
const clothingSizes = [
  'xs',    // Extra Small
  's',     // Small
  'm',     // Medium
  'l',     // Large
  'xl',    // Extra Large
  'xxl',   // Extra Extra Large
  'xxxl',  // Extra Extra Extra Large
  '2xl',   // 2X Large
  '3xl',   // 3X Large
  '4xl',   // 4X Large
];

// Numeric sizes (for pants, jeans, etc.)
const numericSizes = [
  '28',
  '30',
  '32',
  '34',
  '36',
  '38',
  '40',
  '42',
  '44',
  '46',
];

// Generic/electronics sizes
const genericSizes = [
  'one size',
  'standard',
  'small',
  'medium',
  'large',
  'free size',
];

// All sizes combined
const allSizes = [
  ...clothingSizes,
  ...numericSizes,
  ...genericSizes,
];

const seedSizes = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.DB_URL);
    console.log('✓ Connected to MongoDB');

    let totalCreated = 0;
    let totalSkipped = 0;

    console.log('\n📏 Seeding sizes...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Check existing sizes
    const existingSizes = await Size.find({});
    const existingSizeNames = new Set(
      existingSizes.map(size => size.sizeName.toLowerCase())
    );

    console.log(`Found ${existingSizes.length} existing sizes`);

    // Create sizes that don't exist
    for (const sizeName of allSizes) {
      const normalizedName = sizeName.toLowerCase().trim();

      if (existingSizeNames.has(normalizedName)) {
        console.log(`   ⏭️  Skipped: "${sizeName}" (already exists)`);
        totalSkipped++;
        continue;
      }

      try {
        await Size.create({
          sizeName: normalizedName,
          isActive: true,
        });
        console.log(`   ✓ Created: "${sizeName}"`);
        totalCreated++;
        existingSizeNames.add(normalizedName); // Add to set to avoid duplicates in same run
      } catch (error) {
        // Handle duplicate key errors (in case of race condition)
        if (error.code === 11000) {
          console.log(`   ⏭️  Skipped: "${sizeName}" (duplicate)`);
          totalSkipped++;
        } else {
          console.error(`   ❌ Error creating "${sizeName}":`, error.message);
        }
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Size seeding completed!`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Total sizes created: ${totalCreated}`);
    console.log(`Total sizes skipped: ${totalSkipped}`);

    // Show all sizes
    const allSizesInDb = await Size.find({}).sort({ sizeName: 1 });
    console.log(`\n📊 All sizes in database (${allSizesInDb.length} total):`);

    const groupedSizes = {
      'Clothing Sizes': allSizesInDb.filter(s =>
        ['xs', 's', 'm', 'l', 'xl', 'xxl', 'xxxl', '2xl', '3xl', '4xl'].includes(s.sizeName)
      ),
      'Numeric Sizes': allSizesInDb.filter(s =>
        /^\d+$/.test(s.sizeName)
      ),
      'Generic Sizes': allSizesInDb.filter(s =>
        !['xs', 's', 'm', 'l', 'xl', 'xxl', 'xxxl', '2xl', '3xl', '4xl'].includes(s.sizeName) &&
        !/^\d+$/.test(s.sizeName)
      ),
    };

    for (const [group, sizes] of Object.entries(groupedSizes)) {
      if (sizes.length > 0) {
        console.log(`\n   ${group}:`);
        console.log(`   ${sizes.map(s => s.sizeName).join(', ')}`);
      }
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    await mongoose.connection.close();
    console.log('✓ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding sizes:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

seedSizes();
