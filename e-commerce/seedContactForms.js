const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: 'config.env' });

const ContactForm = require('./models/contactFormModel');

// Sample data for generating contact forms
const firstNames = [
  'Ahmed', 'Mohamed', 'Ali', 'Omar', 'Hassan', 'Khaled', 'Mahmoud', 'Ibrahim',
  'Youssef', 'Amr', 'Tarek', 'Waleed', 'Karim', 'Nader', 'Samy', 'Fady',
  'Sherif', 'Maged', 'Osama', 'Ammar', 'Bassem', 'Diaa', 'Eslam', 'Farouk',
  'Fatima', 'Aisha', 'Mariam', 'Sarah', 'Nour', 'Layla', 'Zeinab', 'Rania'
];

const lastNames = [
  'Ali', 'Hassan', 'Ibrahim', 'Mohamed', 'Ahmed', 'Mahmoud', 'Salem', 'Fawzy',
  'Saleh', 'Nagy', 'Farouk', 'Taha', 'Samy', 'Youssef', 'Amr', 'Omar'
];

const messageTemplates = [
  'I would like to know more about your products and pricing.',
  'I have a question about shipping and delivery times.',
  'I am interested in bulk orders. Can you provide more information?',
  'I received a damaged product. How can I get a replacement?',
  'I want to inquire about return and refund policies.',
  'Can you help me with tracking my order?',
  'I would like to become a distributor. Please contact me.',
  'I have a suggestion for improving your service.',
  'I am facing an issue with the checkout process.',
  'I want to know about upcoming sales and discounts.',
  'How can I subscribe to your newsletter?',
  'I need help choosing the right product size.',
  'I want to know about warranty information.',
  'Can you provide information about your return process?',
  'I have a complaint about my recent order.',
  'I am interested in your loyalty program.',
  'I want to change my order details.',
  'I need assistance with my account.',
  'I have questions about payment methods.',
  'Can you provide product recommendations?',
  'I want to know about international shipping.',
  'I need help with the mobile app.',
  'I have feedback about the website design.',
  'I want to know about gift cards and vouchers.',
  'I am interested in career opportunities.',
  'I have questions about product availability.',
  'Can you help me find a specific product?',
  'I want to report a technical issue.',
  'I need information about product specifications.',
  'I have questions about your privacy policy.',
];

// Generate random name
const getRandomName = () => {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  return `${firstName} ${lastName}`;
};

// Generate random email
const getRandomEmail = (name) => {
  const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'yahoo.co.uk'];
  const domain = domains[Math.floor(Math.random() * domains.length)];
  const namePart = name.toLowerCase().replace(/\s+/g, '.');
  const randomNum = Math.floor(Math.random() * 1000);
  return `${namePart}.${randomNum}@${domain}`;
};

// Generate random phone (11 digits)
const getRandomPhone = () => {
  return Math.floor(10000000000 + Math.random() * 90000000000).toString();
};

// Generate random message
const getRandomMessage = () => {
  const template = messageTemplates[Math.floor(Math.random() * messageTemplates.length)];
  const variations = [
    template,
    `${template} Thank you!`,
    `Hello, ${template} I appreciate your help.`,
    `Hi there, ${template} Looking forward to your response.`,
    `${template} Please contact me as soon as possible.`,
    `Dear Team, ${template} Best regards.`,
    template,
  ];
  return variations[Math.floor(Math.random() * variations.length)];
};

const seedContactForms = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.DB_URL);
    console.log('✓ Connected to MongoDB');

    // Delete existing contact forms (optional - comment out if you want to keep them)
    // await ContactForm.deleteMany({});
    // console.log('✓ Cleared existing contact forms');

    // Generate 50 contact forms
    const forms = [];
    const formCount = 50;

    for (let i = 0; i < formCount; i++) {
      // Generate customer info
      const name = getRandomName();
      const email = getRandomEmail(name);
      const phone = getRandomPhone();
      const message = getRandomMessage();

      // Some forms might be replied to
      const isReplied = Math.random() > 0.6; // 40% chance of being replied
      const adminReply = isReplied
        ? [
            'Thank you for contacting us. We have received your inquiry and will get back to you shortly.',
            'Thank you for your message. Our team is looking into your request.',
            'We appreciate your feedback. A member of our team will contact you soon.',
            'Thank you for reaching out. We have noted your concern and will address it promptly.',
            'Thank you for your inquiry. We will review your message and respond within 24 hours.',
          ][Math.floor(Math.random() * 5)]
        : null;

      // Create contact form
      const formData = {
        name: name,
        email: email,
        phone: phone,
        message: message,
        termsAccepted: true,
        isReplied: isReplied,
        adminReply: adminReply,
        isDeleted: false,
      };

      // Add small delay to ensure unique timestamps
      await new Promise(resolve => setTimeout(resolve, 10));

      const form = await ContactForm.create(formData);
      forms.push(form);

      if ((i + 1) % 10 === 0) {
        console.log(`✓ Created ${i + 1}/${formCount} contact forms`);
      }
    }

    console.log('\n✅ Successfully created 50 contact forms!');
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`Total forms created: ${forms.length}`);

    // Show statistics
    const replied = forms.filter(f => f.isReplied).length;
    const notReplied = forms.filter(f => !f.isReplied).length;

    console.log(`Status breakdown:`);
    console.log(`  - Replied: ${replied}`);
    console.log(`  - Not Replied: ${notReplied}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding contact forms:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

seedContactForms();
