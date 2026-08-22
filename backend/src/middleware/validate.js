const validate = (schema) => (req, res, next) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (error) {
    const issues = error.issues || error.errors;
    const errorMsg = issues && Array.isArray(issues)
      ? issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')
      : error.message;

    return res.status(400).json({
      success: false,
      data: null,
      error: errorMsg,
    });
  }
};

module.exports = validate;
