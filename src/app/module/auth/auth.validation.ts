import { z } from "zod";

const registerCustomerSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters"),

  email: z
    .string()
    .email("Please provide a valid email address"),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password cannot exceed 100 characters"),
});

const loginUserSchema = z.object({
  email: z
    .string()
    .email("Please provide a valid email address"),

  password: z
    .string()
    .min(1, "Password is required"),
});

export const AuthValidation = {
  registerCustomerSchema,
  loginUserSchema,
};