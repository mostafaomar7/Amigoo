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
    const forms = await ContactForm.find();
    res.status(200).json({ data: forms });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching forms', error: error.message });
  }
};

exports.getFormById = async (req, res) => {
  try {
    const form = await ContactForm.findById(req.params.id);
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
    const updatedForm = await ContactForm.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
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
    const deletedForm = await ContactForm.findByIdAndDelete(req.params.id);
    if (!deletedForm) {
      return res.status(404).json({ message: 'Form not found' });
    }
    res.status(200).json({ message: 'Form deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting form', error: error.message });
  }
};

