const validate = (schema) => (req, res, next) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (err) {
    // If validation fails, Zod throws an error. 
    // We pass it to next() so our Global Error Handler catches it!
    next(err);
  }
};

module.exports = validate;
