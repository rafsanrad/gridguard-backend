import { z } from "zod";

const createServiceRequestSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(150, "Title cannot exceed 150 characters"),

  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .optional(),

  amount: z.number().positive("Amount must be greater than 0"),

  customerId: z.string().min(1, "Customer ID is required"),
});

const updateServiceRequestSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(150, "Title cannot exceed 150 characters")
    .optional(),

  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .optional(),

  status: z
    .enum([
      "PENDING",
      "APPROVED",
      "IN_PROGRESS",
      "COMPLETED",
      "CANCELLED",
      "REJECTED",
    ])
    .optional(),
});

export const ServiceRequestValidation = {
  createServiceRequestSchema,
  updateServiceRequestSchema,
};
