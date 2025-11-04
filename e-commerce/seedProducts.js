const mongoose = require('mongoose');
const dotenv = require('dotenv');
const slugify = require('slugify');
const fs = require('fs');
const path = require('path');

// Load environment variables
dotenv.config({ path: 'config.env' });

const Product = require('./models/productModel');
const Category = require('./models/categoryModel');

// Sample product data templates based on category
const productTemplates = {
  default: {
    titles: [
      'Premium Quality Product',
      'Classic Style Item',
      'Modern Design Collection',
      'Elegant Fashion Piece',
      'Trendy Style Product',
      'Luxury Edition Item',
      'Professional Grade Product',
      'Stylish Modern Piece'
    ],
    descriptions: [
      'High-quality product crafted with attention to detail. Perfect for everyday use and special occasions.',
      'Beautifully designed item that combines style and functionality. Made from premium materials.',
      'Modern and trendy piece that will elevate your collection. Comfortable and durable.',
      'Elegant design that never goes out of style. Perfect addition to your wardrobe.',
      'Premium quality with excellent craftsmanship. Designed to last and impress.',
      'Stylish and sophisticated item that reflects your personality. Great value for money.',
      'Professional-grade product made from the finest materials. Exceptional quality and durability.',
      'Contemporary design with classic appeal. Versatile and timeless piece.'
    ],
    colors: [
      ['Black', 'White'],
      ['Red', 'Blue'],
      ['Green', 'Yellow'],
      ['Pink', 'Purple'],
      ['Gray', 'Brown'],
      ['Navy', 'Beige'],
      ['Orange', 'Cyan'],
      ['Maroon', 'Teal']
    ]
  },
  clothing: {
    titles: [
      'Cotton T-Shirt',
      'Denim Jeans',
      'Casual Shirt',
      'Sweater Hoodie',
      'Summer Dress',
      'Winter Jacket',
      'Sports Leggings',
      'Formal Shirt'
    ],
    descriptions: [
      'Comfortable cotton t-shirt perfect for casual wear. Soft fabric and modern fit.',
      'Classic denim jeans with perfect fit. Durable and stylish for everyday use.',
      'Casual shirt with modern design. Breathable fabric perfect for all seasons.',
      'Warm and cozy hoodie for cold days. Comfortable and stylish.',
      'Beautiful summer dress with elegant design. Light and airy fabric.',
      'Warm winter jacket to keep you cozy. Water-resistant and stylish.',
      'Comfortable sports leggings for active lifestyle. Stretchy and breathable.',
      'Elegant formal shirt for professional occasions. Crisp and clean design.'
    ],
    colors: [
      ['Black', 'White', 'Gray'],
      ['Blue', 'Navy', 'Indigo'],
      ['Red', 'Pink', 'Maroon'],
      ['Green', 'Olive', 'Mint'],
      ['Brown', 'Beige', 'Tan'],
      ['Purple', 'Lavender'],
      ['Orange', 'Coral'],
      ['Yellow', 'Mustard']
    ]
  },
  electronics: {
    titles: [
      'Wireless Headphones',
      'Smart Watch',
      'Portable Charger',
      'USB Cable',
      'Phone Case',
      'Screen Protector',
      'Bluetooth Speaker',
      'Wireless Mouse'
    ],
    descriptions: [
      'High-quality wireless headphones with noise cancellation. Long battery life and crystal clear sound.',
      'Feature-rich smartwatch with health tracking. Water-resistant and stylish design.',
      'Fast charging portable power bank. Compact and reliable for on-the-go.',
      'Durable USB cable with fast charging support. Compatible with multiple devices.',
      'Protective phone case with modern design. Shock-absorbent and stylish.',
      'Tempered glass screen protector. Easy installation and clear display.',
      'Powerful Bluetooth speaker with rich bass. Long battery life and waterproof.',
      'Ergonomic wireless mouse with precision tracking. Comfortable for long use.'
    ],
    colors: [
      ['Black', 'White'],
      ['Silver', 'Gray'],
      ['Blue', 'Navy'],
      ['Red', 'Pink'],
      ['Gold', 'Rose Gold'],
      ['Green', 'Teal'],
      ['Purple', 'Lavender'],
      ['Orange', 'Yellow']
    ]
  }
};

// Common sizes
const commonSizes = ['s', 'm', 'l', 'xl', 'xxl'];
const electronicSizes = ['one size', 'standard', 'small', 'medium', 'large'];

// Generate random product data
const generateProduct = (category, index, coverImages, regularImages) => {
  const categoryName = category.name.toLowerCase();

  // Determine template based on category name
  let template = productTemplates.default;
  if (categoryName.includes('clothing') || categoryName.includes('apparel') ||
      categoryName.includes('shirt') || categoryName.includes('dress') ||
      categoryName.includes('jacket') || categoryName.includes('pants')) {
    template = productTemplates.clothing;
  } else if (categoryName.includes('electronic') || categoryName.includes('tech') ||
             categoryName.includes('phone') || categoryName.includes('computer')) {
    template = productTemplates.electronics;
  }

  const titleIndex = index % template.titles.length;
  const title = template.titles[titleIndex];
  const description = template.descriptions[titleIndex];
  const colors = template.colors[titleIndex % template.colors.length];

  // Generate price between 50 and 500
  const price = Math.floor(Math.random() * 450) + 50;

  // 30% chance of having discount
  const hasDiscount = Math.random() < 0.3;
  const priceAfterDiscount = hasDiscount
    ? Math.floor(price * (0.7 + Math.random() * 0.2)) // 20-30% discount
    : undefined;

  // Generate quantity array with random sizes
  const useElectronicSizes = template === productTemplates.electronics;
  const availableSizes = useElectronicSizes ? electronicSizes : commonSizes;
  const numSizes = Math.floor(Math.random() * 3) + 2; // 2-4 sizes
  const selectedSizes = availableSizes
    .sort(() => Math.random() - 0.5)
    .slice(0, numSizes);

  const quantity = selectedSizes.map(size => ({
    size: size,
    no: Math.floor(Math.random() * 50) + 10 // 10-59 items per size
  }));

  // Use real images from uploads/products directory
  // Select a random cover image (cycle through if needed)
  const imageCover = coverImages.length > 0
    ? coverImages[index % coverImages.length]
    : 'product-placeholder.jpg';

  // Select 1-3 random regular images
  const numImages = Math.min(Math.floor(Math.random() * 3) + 1, regularImages.length);
  const selectedImages = regularImages.length > 0
    ? regularImages
        .sort(() => Math.random() - 0.5)
        .slice(0, numImages)
    : ['product-placeholder-1.jpg'];

  return {
    title: `${title} ${index + 1}`,
    slug: slugify(`${title} ${index + 1}`, { lower: true }),
    description,
    price,
    priceAfterDiscount,
    colors,
    imageCover,
    images: selectedImages,
    category: category._id,
    quantity,
    sold: Math.floor(Math.random() * 100) // Random sales count
  };
};

const seedProducts = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.DB_URL);
    console.log('✓ Connected to MongoDB');

    // Load product images from uploads/products directory
    const productsDir = path.join(__dirname, 'uploads', 'products');
    let coverImages = [];
    let regularImages = [];

    try {
      if (fs.existsSync(productsDir)) {
        const imageFiles = fs.readdirSync(productsDir)
          .filter(file => /\.(webp|jpg|jpeg|png)$/i.test(file))
          .map(file => file); // Store just the filename, not full path

        // Separate cover images from regular images
        coverImages = imageFiles.filter(file => file.includes('-cover.'));
        regularImages = imageFiles.filter(file => !file.includes('-cover.'));

        console.log(`✓ Loaded ${coverImages.length} cover images and ${regularImages.length} regular images`);
      } else {
        console.log('⚠️  uploads/products directory not found, using placeholder images');
      }
    } catch (error) {
      console.log('⚠️  Error loading images:', error.message, '- using placeholder images');
    }

    // Get all categories that are not deleted
    const categories = await Category.find({ isDeleted: false });

    if (categories.length === 0) {
      console.log('❌ No categories found in database. Please create categories first.');
      await mongoose.connection.close();
      process.exit(1);
    }

    console.log(`✓ Found ${categories.length} categories`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    let totalCreated = 0;
    const minProductsPerCategory = 3; // Minimum products per category
    const maxProductsPerCategory = 7; // Maximum products per category

    // Process each category
    for (const category of categories) {
      // Count existing products for this category
      const existingProductsCount = await Product.countDocuments({
        category: category._id,
        isDeleted: false
      });

      console.log(`\n📦 Category: ${category.name}`);
      console.log(`   Existing products: ${existingProductsCount}`);

      // Determine how many products to create
      let productsToCreate = 0;
      if (existingProductsCount < minProductsPerCategory) {
        productsToCreate = minProductsPerCategory - existingProductsCount;
        // Add some random extra products (up to maxProductsPerCategory)
        const targetTotal = Math.floor(Math.random() * (maxProductsPerCategory - minProductsPerCategory + 1)) + minProductsPerCategory;
        if (targetTotal > existingProductsCount) {
          productsToCreate = targetTotal - existingProductsCount;
        }
      }

      // Update existing products with real images if they have placeholder images
      if (existingProductsCount > 0 && (coverImages.length > 0 || regularImages.length > 0)) {
        const existingProducts = await Product.find({
          category: category._id,
          isDeleted: false
        });

        let updatedCount = 0;
        for (let i = 0; i < existingProducts.length; i++) {
          const product = existingProducts[i];
          const needsUpdate = product.imageCover === 'product-placeholder.jpg' ||
                             product.images.length === 0 ||
                             product.images[0] === 'product-placeholder-1.jpg';

          if (needsUpdate) {
            const newImageCover = coverImages.length > 0
              ? coverImages[i % coverImages.length]
              : product.imageCover;

            const numImages = Math.min(Math.floor(Math.random() * 3) + 1, regularImages.length);
            const newImages = regularImages.length > 0
              ? regularImages
                  .sort(() => Math.random() - 0.5)
                  .slice(0, numImages)
              : product.images;

            await Product.updateOne(
              { _id: product._id },
              {
                $set: {
                  imageCover: newImageCover,
                  images: newImages
                }
              }
            );
            updatedCount++;
          }
        }
        if (updatedCount > 0) {
          console.log(`   ✓ Updated ${updatedCount} existing products with real images`);
        }
      }

      if (productsToCreate > 0) {
        console.log(`   Creating ${productsToCreate} new products...`);

        // Create products for this category
        const products = [];
        for (let i = 0; i < productsToCreate; i++) {
          const productData = generateProduct(
            category,
            existingProductsCount + i,
            coverImages,
            regularImages
          );
          products.push(productData);
        }

        // Insert products
        const createdProducts = await Product.insertMany(products);
        totalCreated += createdProducts.length;
        console.log(`   ✓ Created ${createdProducts.length} products`);
      } else {
        console.log(`   ✓ Category already has enough products`);
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Successfully seeded products!`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`Total products created: ${totalCreated}`);

    // Show statistics by category
    console.log('\n📊 Product count by category:');
    for (const category of categories) {
      const count = await Product.countDocuments({
        category: category._id,
        isDeleted: false
      });
      console.log(`   - ${category.name}: ${count} products`);
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    await mongoose.connection.close();
    console.log('✓ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding products:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

seedProducts();
