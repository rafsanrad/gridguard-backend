import { z } from "zod";

const updateUserStatusSchema = z.object({
  status: z.enum([
    "ACTIVE",
    "BLOCKED",
  ]),
});

const updateUserSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters")
    .optional(),

  phone: z
    .string()
    .max(20, "Phone number cannot exceed 20 characters")
    .optional(),

  gender: z
    .enum(["MALE", "FEMALE", "OTHER"])
    .optional(),

  role: z
    .enum(["CUSTOMER", "OPERATOR", "ADMIN"])
    .optional(),
});

export const UserValidation = {
  updateUserStatusSchema,
  updateUserSchema,
};