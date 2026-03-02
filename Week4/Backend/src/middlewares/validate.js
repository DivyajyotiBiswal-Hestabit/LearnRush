const { ZodError } = require("zod");

const validate = (schema) => (req, res, next) => {
  try {
    const parsed = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    // Only update body safely
    if (parsed.body) {
      req.body = parsed.body;
    }

    // Do NOT reassign req.query or req.params
    // Instead mutate them if needed
    if (parsed.query) {
      Object.assign(req.query, parsed.query);
    }

    if (parsed.params) {
      Object.assign(req.params, parsed.params);
    }

    next();
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: err.errors,
      });
    }

    next(err);
  }
};

module.exports = validate;