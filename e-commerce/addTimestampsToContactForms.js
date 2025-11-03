const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: 'config.env' });

const ContactForm = require('./models/contactFormModel');

const addTimestampsToExistingForms = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.DB_URL);
    console.log('✓ Connected to MongoDB');

    // Find all contact forms without createdAt
    const formsWithoutTimestamps = await ContactForm.find({
      createdAt: { $exists: false }
    });

    console.log(`Found ${formsWithoutTimestamps.length} contact forms without timestamps`);

    if (formsWithoutTimestamps.length === 0) {
      console.log('✓ All contact forms already have timestamps');
      await mongoose.connection.close();
      process.exit(0);
    }

    // Update each form with createdAt and updatedAt
    // Use the _id timestamp to approximate creation time
    let updated = 0;
    for (const form of formsWithoutTimestamps) {
      // Extract timestamp from ObjectId (first 4 bytes represent seconds since epoch)
      const objectIdTimestamp = form._id.getTimestamp();

      await ContactForm.findByIdAndUpdate(
        form._id,
        {
          $set: {
            createdAt: objectIdTimestamp,
            updatedAt: objectIdTimestamp
          }
        },
        { runValidators: false }
      );
      updated++;
    }

    console.log(`✓ Successfully added timestamps to ${updated} contact forms`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding timestamps:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

addTimestampsToExistingForms();
