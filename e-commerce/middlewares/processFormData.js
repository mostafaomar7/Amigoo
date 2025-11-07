/**
 * Middleware to process FormData fields
 * Converts multiple values with the same field name to arrays
 * and normalizes color arrays
 */
exports.processFormData = (req, res, next) => {
  // Process colors field - multer may send it as array or single value
  if (req.body.colors !== undefined) {
    // If colors is already an array, keep it
    if (Array.isArray(req.body.colors)) {
      // Filter out empty values and normalize
      req.body.colors = req.body.colors
        .filter(color => color && typeof color === 'string' && color.trim())
        .map(color => color.trim().toLowerCase());
    } else if (typeof req.body.colors === 'string') {
      // Single string value, convert to array
      const trimmedColor = req.body.colors.trim();
      req.body.colors = trimmedColor ? [trimmedColor.toLowerCase()] : [];
    } else {
      // If colors is null, undefined, or invalid, set to empty array
      req.body.colors = [];
    }
  } else {
    // If colors is not provided, set to empty array
    req.body.colors = [];
  }

  next();
};
