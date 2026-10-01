import { z } from "zod";

const registerCustomerSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters"),

  email: z.email("Please provide a valid email address"),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password cannot exceed 100 characters"),
});

const loginUserSchema = z.object({
  email: z.email("Please provide a valid email address"),

  password: z
    .string()
    .min(1, "Password is required"),
});

const verifyEmailSchema = z.object({
  email: z.email("Please provide a valid email address"),
});

const verifyEmailOtpSchema = z.object({
  email: z.email("Please provide a valid email address"),

  otp: z
    .string()
    .length(6, "OTP must be exactly 6 digits")
    .regex(/^\d+$/, "OTP must contain only numbers"),
});

const forgotPasswordSchema = z.object({
  email: z.email("Please provide a valid email address"),
});

const resetPasswordSchema = z.object({
  email: z.email("Please provide a valid email address"),

  otp: z
    .string()
    .length(6, "OTP must be exactly 6 digits")
    .regex(/^\d+$/, "OTP must contain only numbers"),

  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password cannot exceed 100 characters"),
});

const googleLoginSchema = z.object({
  idToken: z
    .string()
    .min(1, "Google ID token is required"),
});

export const AuthValidation = {
  registerCustomerSchema,
  verifyEmailSchema,
  verifyEmailOtpSchema,
  loginUserSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  googleLoginSchema
};