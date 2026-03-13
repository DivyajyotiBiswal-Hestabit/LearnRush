// src/middlewares/validate.js
const { ZodError } = require("zod");
const xss = require("xss"); // to sanitize user input

const validate = (schema) => (req, res, next) => {
  try {
    // Parse request body, query, and params using the schema
    const parsed = schema.parse({
      body: req.body || {},
      query: req.query || {},
      params: req.params || {},
    });

    // Sanitize strings in body to prevent XSS
    if (parsed.body) {
      for (const key in parsed.body) {
        if (typeof parsed.body[key] === "string") {
          parsed.body[key] = xss(parsed.body[key]);
        }
      }
      req.body = parsed.body;
    }

    // Merge parsed query and params safely
    if (parsed.query) {
      Object.assign(req.query, parsed.query);
    }

    if (parsed.params) {
      Object.assign(req.params, parsed.params);
    }

    next();
  } catch (err) {
    if (err instanceof ZodError) {
      // Map errors safely
      const formattedErrors = Array.isArray(err.errors)
        ? err.errors.map((e) => ({
            path: e.path?.join(".") || "unknown",
            message: e.message || "Invalid value",
          }))
        : [
            {
              path: "unknown",
              message: err.message || "Validation failed",
            },
          ];

      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: formattedErrors,
        requestId: req.requestId,
      });
    }

    // Pass other errors to the global error handler
    next(err);
  }
};

module.exports = validate;