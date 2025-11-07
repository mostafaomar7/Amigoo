const asyncHandler = require('express-async-handler');
const fs = require('fs');
const path = require('path');
const slugify = require('slugify');
const { v4: uuidv4 } = require('uuid');
const Category = require('../models/categoryModel');
const Product = require('../models/productModel');
const Order = require('../models/orderModel');
const User = require('../models/User');

// بيانات وهمية بالعربية المصرية
const fakeCategories = [
  'قمصان',
  'بنطلونات',
  'جاكيتات',
  'أحذية',
  'حقائب',
  'ساعات'
];

// قوالب المنتجات لكل قسم
const productTemplates = {
  'قمصان': {
    prefixes: ['قميص', 'تيشيرت', 'بلوزة', 'قميص بولو', 'قميص كاجوال', 'قميص رسمي', 'قميص رياضي', 'قميص قطني', 'قميص صيفي', 'قميص شتوي'],
    suffixes: ['كلاسيكي', 'عصري', 'أنيق', 'مريح', 'عالي الجودة', 'قطني', 'رياضي', 'كاجوال', 'رسمي', 'صيفي'],
    descriptions: [
      'مناسب للاستخدام اليومي. تصميم عصري وأنيق.',
      'مريح وعالي الجودة. مثالي لجميع المناسبات.',
      'تصميم كلاسيكي لا يخرج عن الموضة.',
      'قماش عالي الجودة ومريح.',
      'أنيق ومناسب للمناسبات الرسمية والكاجوال.',
      'مثالي للأنشطة الرياضية والاستخدام اليومي.',
      'تصميم راقي وجودة ممتازة.',
      'مناسب للصيف والطقس الحار.',
      'دافئ ومريح للطقس البارد.',
      'عملي وأنيق للاستخدام اليومي.'
    ],
    priceRange: { min: 150, max: 500 },
    discountRange: { min: 0.15, max: 0.25 },
    colors: [['أبيض', 'أسود', 'رمادي'], ['أزرق', 'أبيض', 'رمادي'], ['أسود', 'رمادي', 'بني'], ['أبيض', 'أزرق', 'أخضر'], ['أسود', 'أحمر', 'رمادي']]
  },
  'بنطلونات': {
    prefixes: ['بنطلون', 'جينز', 'بنطلون كاجوال', 'بنطلون رياضي', 'بنطلون رسمي', 'بنطلون شتوي', 'بنطلون صيفي', 'بنطلون قطني', 'بنطلون كولون', 'بنطلون ضيق'],
    suffixes: ['كلاسيكي', 'عصري', 'مريح', 'عالي الجودة', 'أنيق', 'رياضي', 'كاجوال', 'رسمي', 'صيفي', 'شتوي'],
    descriptions: [
      'مريح ومناسب لجميع المناسبات. تصميم كلاسيكي.',
      'عالي الجودة ومريح. مثالي للاستخدام اليومي.',
      'أنيق ومناسب للمناسبات الرسمية والكاجوال.',
      'مريح وعملي للأنشطة الرياضية.',
      'تصميم عصري وجودة ممتازة.',
      'مناسب للصيف والطقس الحار.',
      'دافئ ومريح للطقس البارد.',
      'قماش عالي الجودة ومريح.',
      'تصميم راقي وأنيق.',
      'عملي ومريح للاستخدام اليومي.'
    ],
    priceRange: { min: 300, max: 800 },
    discountRange: { min: 0.15, max: 0.25 },
    colors: [['أزرق', 'أسود'], ['أسود', 'رمادي'], ['بني', 'أسود'], ['أزرق فاتح', 'أزرق غامق'], ['رمادي', 'أسود']]
  },
  'جاكيتات': {
    prefixes: ['جاكيت', 'جاكيت رياضي', 'جاكيت شتوي', 'جاكيت صيفي', 'جاكيت كاجوال', 'جاكيت رسمي', 'جاكيت رياضي', 'جاكيت واقي', 'جاكيت خفيف', 'جاكيت دافئ'],
    suffixes: ['كلاسيكي', 'عصري', 'مريح', 'عالي الجودة', 'أنيق', 'رياضي', 'كاجوال', 'رسمي', 'صيفي', 'شتوي'],
    descriptions: [
      'خفيف ومريح، مثالي للأنشطة الرياضية والاستخدام اليومي.',
      'دافئ ومريح، يحميك من البرد. تصميم عصري.',
      'أنيق ومناسب للمناسبات الرسمية والكاجوال.',
      'مريح وعالي الجودة. مثالي لجميع المناسبات.',
      'تصميم راقي وجودة ممتازة.',
      'مناسب للصيف والطقس الحار.',
      'دافئ ومريح للطقس البارد.',
      'عملي وأنيق للاستخدام اليومي.',
      'مثالي للأنشطة الرياضية.',
      'تصميم عصري وجودة عالية.'
    ],
    priceRange: { min: 400, max: 1200 },
    discountRange: { min: 0.15, max: 0.25 },
    colors: [['أسود', 'رمادي', 'أزرق'], ['بني', 'أسود', 'رمادي'], ['أزرق', 'رمادي', 'أسود'], ['أسود', 'رمادي'], ['بني', 'أسود']]
  },
  'أحذية': {
    prefixes: ['حذاء', 'حذاء رياضي', 'حذاء كاجوال', 'حذاء رسمي', 'حذاء شتوي', 'حذاء صيفي', 'حذاء رياضي', 'حذاء مريح', 'حذاء أنيق', 'حذاء عصري'],
    suffixes: ['كلاسيكي', 'عصري', 'مريح', 'عالي الجودة', 'أنيق', 'رياضي', 'كاجوال', 'رسمي', 'صيفي', 'شتوي'],
    descriptions: [
      'مريح وعصري، مناسب للمشي والرياضة. يوفر دعم ممتاز للقدم.',
      'أنيق ومناسب للمناسبات الرسمية والكاجوال.',
      'مريح وعالي الجودة. مثالي للاستخدام اليومي.',
      'تصميم راقي وجودة ممتازة.',
      'مناسب للصيف والطقس الحار.',
      'دافئ ومريح للطقس البارد.',
      'مثالي للأنشطة الرياضية.',
      'عملي وأنيق للاستخدام اليومي.',
      'تصميم عصري وجودة عالية.',
      'مريح ويوفر راحة ممتازة.'
    ],
    priceRange: { min: 300, max: 1500 },
    discountRange: { min: 0.15, max: 0.25 },
    colors: [['أبيض', 'أسود', 'أزرق'], ['بني', 'أسود', 'أبيض'], ['أسود', 'رمادي', 'أبيض'], ['أزرق', 'أبيض'], ['بني', 'أسود']]
  },
  'حقائب': {
    prefixes: ['حقيبة', 'حقيبة ظهر', 'حقيبة يد', 'حقيبة سفر', 'حقيبة كتف', 'حقيبة رياضية', 'حقيبة عمل', 'حقيبة سفر', 'حقيبة صغيرة', 'حقيبة كبيرة'],
    suffixes: ['كلاسيكية', 'عصرية', 'عملية', 'عالية الجودة', 'أنيقة', 'رياضية', 'كاجوال', 'رسمية', 'صيفية', 'شتوية'],
    descriptions: [
      'عملية وأنيقة، مناسبة للعمل والسفر. تتسع لجميع احتياجاتك.',
      'أنيقة وعملية، مناسبة للمناسبات الرسمية والكاجوال.',
      'مريحة وعالية الجودة. مثالية للاستخدام اليومي.',
      'تصميم راقي وجودة ممتازة.',
      'مناسبة للسفر والرحلات.',
      'عملية ومريحة للاستخدام اليومي.',
      'أنيقة ومناسبة للمناسبات الرسمية.',
      'مثالية للعمل والسفر.',
      'تصميم عصري وجودة عالية.',
      'عملية ومريحة لجميع احتياجاتك.'
    ],
    priceRange: { min: 200, max: 1000 },
    discountRange: { min: 0.15, max: 0.25 },
    colors: [['أسود', 'رمادي', 'بني'], ['بني', 'أسود', 'رمادي'], ['أحمر', 'أسود', 'بني'], ['رمادي', 'أسود'], ['بني', 'أسود']]
  },
  'ساعات': {
    prefixes: ['ساعة', 'ساعة يد', 'ساعة ذكية', 'ساعة كلاسيكية', 'ساعة رياضية', 'ساعة أنيقة', 'ساعة عصرية', 'ساعة رجالية', 'ساعة نسائية', 'ساعة فاخرة'],
    suffixes: ['كلاسيكية', 'عصرية', 'أنيقة', 'عالية الجودة', 'رياضية', 'ذكية', 'فاخرة', 'رسمية', 'كاجوال', 'أنيقة'],
    descriptions: [
      'أنيقة ومناسبة لجميع المناسبات. تصميم راقي وجودة عالية.',
      'ذكية بتقنيات حديثة، تتبع اللياقة البدنية والأنشطة اليومية.',
      'كلاسيكية أنيقة، مناسبة للمناسبات الرسمية.',
      'رياضية عملية، مناسبة للأنشطة الرياضية.',
      'عصرية وأنيقة، مناسبة للاستخدام اليومي.',
      'فاخرة وجودة ممتازة. تصميم راقي.',
      'أنيقة ومناسبة لجميع المناسبات.',
      'ذكية وعملية، تتبع الأنشطة اليومية.',
      'كلاسيكية وجودة عالية.',
      'عصرية وأنيقة للاستخدام اليومي.'
    ],
    priceRange: { min: 500, max: 3000 },
    discountRange: { min: 0.15, max: 0.25 },
    colors: [['أسود', 'فضي', 'ذهبي'], ['فضي', 'ذهبي', 'أسود'], ['ذهبي', 'فضي', 'أسود'], ['أسود', 'فضي'], ['ذهبي', 'فضي']]
  }
};

// دالة لتوليد منتجات وهمية
const generateFakeProducts = (targetCount = 500) => {
  const products = [];
  const categories = Object.keys(productTemplates);
  const productsPerCategory = Math.ceil(targetCount / categories.length);

  categories.forEach((categoryName) => {
    const template = productTemplates[categoryName];

    for (let i = 0; i < productsPerCategory; i++) {
      const prefix = template.prefixes[Math.floor(Math.random() * template.prefixes.length)];
      const suffix = template.suffixes[Math.floor(Math.random() * template.suffixes.length)];
      const description = template.descriptions[Math.floor(Math.random() * template.descriptions.length)];
      const colorSet = template.colors[Math.floor(Math.random() * template.colors.length)];

      const basePrice = Math.floor(Math.random() * (template.priceRange.max - template.priceRange.min + 1)) + template.priceRange.min;
      const discountPercent = Math.random() * (template.discountRange.max - template.discountRange.min) + template.discountRange.min;
      const priceAfterDiscount = Math.floor(basePrice * (1 - discountPercent));

      products.push({
        title: `${prefix} ${suffix}`,
        description: `${prefix} ${suffix} ${description}`,
        price: basePrice,
        priceAfterDiscount: priceAfterDiscount,
        colors: colorSet,
        category: categoryName
      });
    }
  });

  // خلط المنتجات عشوائياً
  for (let i = products.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [products[i], products[j]] = [products[j], products[i]];
  }

  return products.slice(0, targetCount);
};

const fakeSizes = ['xs', 's', 'm', 'l', 'xl', 'xxl'];

// بيانات وهمية للطلبات
const fakeCustomers = [
  { name: 'أحمد محمد', email: 'ahmed@example.com', phone: '01012345678' },
  { name: 'فاطمة علي', email: 'fatima@example.com', phone: '01123456789' },
  { name: 'محمد حسن', email: 'mohamed@example.com', phone: '01234567890' },
  { name: 'سارة إبراهيم', email: 'sara@example.com', phone: '01512345678' },
  { name: 'خالد أحمد', email: 'khaled@example.com', phone: '01098765432' },
];

const fakeAddresses = [
  { street: 'شارع التحرير', state: 'القاهرة', country: 'مصر' },
  { street: 'شارع النيل', state: 'الجيزة', country: 'مصر' },
  { street: 'شارع رمسيس', state: 'القاهرة', country: 'مصر' },
  { street: 'شارع كورنيش النيل', state: 'الإسكندرية', country: 'مصر' },
  { street: 'شارع الجامعة', state: 'المنصورة', country: 'مصر' },
];

// دالة لتوليد رقم طلب فريد
const generateOrderNumber = () => {
  return `ORD-${Date.now()}-${uuidv4().substring(0, 8).toUpperCase()}`;
};

// دالة للحصول على ملفات الصور من مجلد معين
const getImageFiles = (dirPath) => {
  try {
    const fullPath = path.join(__dirname, '..', 'uploads', dirPath);
    if (!fs.existsSync(fullPath)) {
      return [];
    }
    const files = fs.readdirSync(fullPath);
    return files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.webp', '.jpg', '.jpeg', '.png'].includes(ext);
    });
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error);
    return [];
  }
};

// دالة للحصول على صورة عشوائية
const getRandomImage = (images) => {
  if (!images || images.length === 0) return null;
  return images[Math.floor(Math.random() * images.length)];
};

// دالة لملء البيانات الوهمية
exports.seedDatabase = asyncHandler(async (req, res) => {
  try {

    // الحصول على الصور المتاحة
    const categoryImages = getImageFiles('category');
    const productImages = getImageFiles('products');

    if (categoryImages.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'لا توجد صور للأقسام في مجلد uploads/category',
      });
    }

    if (productImages.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'لا توجد صور للمنتجات في مجلد uploads/products',
      });
    }

    // إنشاء مستخدم وهمي للطلبات
    let fakeUser = await User.findOne({ email: 'seed@example.com' });
    if (!fakeUser) {
      fakeUser = await User.create({
        name: 'مستخدم وهمي',
        email: 'seed@example.com',
        password: 'seed123456',
        role: 'user',
      });
    }

    // إنشاء الأقسام
    const createdCategories = [];
    let categoryImageIndex = 0;
    for (const categoryName of fakeCategories) {
      // التحقق من وجود القسم أولاً
      let category = await Category.findOne({ name: categoryName, isDeleted: false });

      if (!category) {
        const categoryImage = categoryImages[categoryImageIndex % categoryImages.length];
        categoryImageIndex++;

        try {
          category = await Category.create({
            name: categoryName,
            slug: slugify(categoryName, { lower: true }),
            image: categoryImage,
            isDeleted: false,
          });
        } catch (error) {
          // في حالة وجود قسم بنفس الاسم، جرب البحث مرة أخرى
          category = await Category.findOne({ name: categoryName, isDeleted: false });
          if (!category) {
            console.error(`Error creating category ${categoryName}:`, error);
            continue;
          }
        }
      }
      createdCategories.push(category);
    }

    // توليد 500 منتج وهمي
    const fakeProducts = generateFakeProducts(500);

    // إنشاء المنتجات
    const createdProducts = [];
    let productImageIndex = 0;

    // إنشاء خريطة للأقسام حسب الاسم
    const categoryMap = {};
    createdCategories.forEach(cat => {
      categoryMap[cat.name] = cat;
    });

    for (let i = 0; i < fakeProducts.length; i++) {
      const productData = fakeProducts[i];
      const category = categoryMap[productData.category];

      if (!category) {
        console.error(`Category not found: ${productData.category}`);
        continue;
      }

      // الحصول على صورة cover
      const coverImage = productImages[productImageIndex % productImages.length];
      productImageIndex++;

      // الحصول على صور إضافية (1-3 صور)
      const additionalImagesCount = Math.floor(Math.random() * 3) + 1;
      const additionalImages = [];
      for (let j = 0; j < additionalImagesCount; j++) {
        const img = productImages[productImageIndex % productImages.length];
        if (img !== coverImage && !additionalImages.includes(img)) {
          additionalImages.push(img);
        }
        productImageIndex++;
      }

      // إنشاء كميات عشوائية للأحجام
      const quantity = [];
      for (const sizeName of fakeSizes) {
        quantity.push({
          size: sizeName.toLowerCase(),
          no: Math.floor(Math.random() * 50) + 10, // من 10 إلى 60
        });
      }

      // إنشاء slug فريد لتجنب التكرار
      const baseSlug = slugify(productData.title, { lower: true });
      const uniqueSlug = `${baseSlug}-${Date.now()}-${i}-${Math.floor(Math.random() * 10000)}`;

      try {
        const product = await Product.create({
          title: productData.title,
          slug: uniqueSlug,
          description: productData.description,
          price: productData.price,
          priceAfterDiscount: productData.priceAfterDiscount,
          colors: productData.colors,
          imageCover: coverImage,
          images: additionalImages.length > 0 ? additionalImages : [coverImage],
          category: category._id,
          quantity: quantity,
          sold: Math.floor(Math.random() * 100),
          isDeleted: false,
        });

        createdProducts.push(product);
      } catch (error) {
        console.error(`Error creating product ${productData.title}:`, error);
        // تجاهل المنتج في حالة الخطأ والمتابعة
      }
    }

    // إنشاء الطلبات الوهمية
    const createdOrders = [];
    const orderStatuses = ['pending', 'completed', 'cancelled'];

    // إنشاء 10-15 طلب وهمي
    const numberOfOrders = Math.floor(Math.random() * 6) + 10; // من 10 إلى 15

    for (let i = 0; i < numberOfOrders; i++) {
      const customer = fakeCustomers[Math.floor(Math.random() * fakeCustomers.length)];
      const address = fakeAddresses[Math.floor(Math.random() * fakeAddresses.length)];
      const status = orderStatuses[Math.floor(Math.random() * orderStatuses.length)];

      // اختيار 1-4 منتجات عشوائية للطلب
      const numberOfItems = Math.floor(Math.random() * 4) + 1;
      const selectedProducts = [];
      const selectedIndices = new Set();

      while (selectedIndices.size < numberOfItems) {
        const randomIndex = Math.floor(Math.random() * createdProducts.length);
        selectedIndices.add(randomIndex);
      }

      let totalAmount = 0;
      const orderItems = [];

      selectedIndices.forEach((index) => {
        const product = createdProducts[index];
        const size = fakeSizes[Math.floor(Math.random() * fakeSizes.length)];
        const quantity = Math.floor(Math.random() * 3) + 1; // من 1 إلى 3
        const price = product.priceAfterDiscount || product.price;
        const totalPrice = price * quantity;

        orderItems.push({
          productId: product._id,
          sizeName: size,
          quantity: quantity,
          price: price,
          totalPrice: totalPrice,
        });

        totalAmount += totalPrice;
      });

      const shippingCost = totalAmount > 1000 ? 0 : 50; // شحن مجاني للطلبات فوق 1000
      const finalAmount = totalAmount + shippingCost;

      const order = await Order.create({
        userId: fakeUser._id,
        orderNumber: generateOrderNumber(),
        status: status,
        fullName: customer.name,
        country: address.country,
        streetAddress: address.street,
        state: address.state,
        phone: customer.phone,
        email: customer.email,
        shippingAddress: false,
        orderNotes: i % 3 === 0 ? 'يرجى التوصيل في الصباح' : '',
        items: orderItems,
        totalAmount: totalAmount,
        shippingCost: shippingCost,
        finalAmount: finalAmount,
      });

      createdOrders.push(order);
    }

    res.status(200).json({
      success: true,
      message: 'تم ملء قاعدة البيانات بالبيانات الوهمية بنجاح',
      data: {
        categories: createdCategories.length,
        products: createdProducts.length,
        orders: createdOrders.length,
      },
    });
  } catch (error) {
    console.error('Error seeding database:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء ملء قاعدة البيانات',
      error: error.message,
    });
  }
});
