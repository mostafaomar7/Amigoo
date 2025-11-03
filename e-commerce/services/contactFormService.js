const ContactForm = require('../models/contactFormModel');

exports.submitForm = async (req, res) => {
  try {
    const formData = await ContactForm.create(req.body);
    res.status(201).json({
      status: 'success',
      data: formData,
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message,
    });
  }
};


exports.getAllForms = async (req, res) => {
  try {
    const { page: pageQuery, limit: limitQuery, keyword: keywordQuery, isReplied } = req.query;
    const page = pageQuery * 1 || 1;
    const limit = limitQuery * 1 || 10;
    const skip = (page - 1) * limit;
    const keyword = keywordQuery || '';

    const searchQuery = keyword
      ? {
          $or: [
            { name: { $regex: keyword, $options: 'i' } }, // Search in name
            { email: { $regex: keyword, $options: 'i' } }, // Search in email
            { phone: { $regex: keyword, $options: 'i' } }, // Search in phone
            { message: { $regex: keyword, $options: 'i' } }, // Search in message
          ],
        }
      : {};

    const filter = {
      ...searchQuery,
      isDeleted: false,
      ...(isReplied !== undefined && { isReplied: isReplied === 'true' }),
    };

    const forms = await ContactForm.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const totalItems = await ContactForm.countDocuments(filter);
    const totalPages = Math.ceil(totalItems / limit);

    res.status(200).json({
      success: true,
      message: 'Contact forms retrieved successfully',
      data: forms,
      pagination: {
        currentPage: page,
        itemsPerPage: limit,
        totalItems: totalItems,
        totalPages: totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching forms', error: error.message });
  }
};

exports.getFormById = async (req, res) => {
  try {
    const form = await ContactForm.findOne({ _id: req.params.id, isDeleted: false });
    if (!form) {
      return res.status(404).json({ message: 'Form not found' });
    }
    res.status(200).json({ data: form });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching form', error: error.message });
  }
};

exports.updateForm = async (req, res) => {
  try {
    const updatedForm = await ContactForm.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );
    if (!updatedForm) {
      return res.status(404).json({ message: 'Form not found' });
    }
    res.status(200).json({ message: 'Form updated successfully', data: updatedForm });
  } catch (error) {
    res.status(400).json({ message: 'Error updating form', error: error.message });
  }
};

exports.deleteForm = async (req, res) => {
  try {
    const deletedForm = await ContactForm.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );
    if (!deletedForm) {
      return res.status(404).json({ message: 'Form not found' });
    }
    res.status(200).json({ message: 'Form deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting form', error: error.message });
  }
};

// Admin reply to contact form
exports.replyToForm = async (req, res) => {
  try {
    const { adminReply } = req.body;

    if (!adminReply || adminReply.trim() === '') {
      return res.status(400).json({ message: 'Admin reply is required' });
    }

    const updatedForm = await ContactForm.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      {
        adminReply: adminReply.trim(),
        isReplied: true
      },
      { new: true, runValidators: true }
    );

    if (!updatedForm) {
      return res.status(404).json({ message: 'Form not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Reply sent successfully',
      data: updatedForm
    });
  } catch (error) {
    res.status(500).json({ message: 'Error replying to form', error: error.message });
  }
};
