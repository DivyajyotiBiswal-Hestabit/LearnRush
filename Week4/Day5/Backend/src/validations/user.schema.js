// src/validations/user.schema.js
const { z } = require("zod");

const createUserSchema = z.object({
  body: z.object({
    firstName: z
      .string()
      .min(2, "First name must be at least 2 characters")
      .max(50, "First name too long"),
    lastName: z
      .string()
      .min(2, "Last name must be at least 2 characters")
      .max(50, "Last name too long"),
    email: z.string().email("Invalid email address"),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .max(255, "Password too long"),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

module.exports = { createUserSchema };