import { z } from "zod";

const createAreaSchema = z.object({
  name: z
    .string()
    .min(2, "Area name must be at least 2 characters")
    .max(100, "Area name cannot exceed 100 characters"),

  code: z
    .string()
    .min(2, "Area code is required")
    .max(20, "Area code cannot exceed 20 characters"),

  address: z
    .string()
    .max(255, "Address cannot exceed 255 characters")
    .optional(),

  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .optional(),

  feederId: z
    .string()
    .min(1, "Feeder ID is required"),
});

const updateAreaSchema = z.object({
  name: z
    .string()
    .min(2, "Area name must be at least 2 characters")
    .max(100, "Area name cannot exceed 100 characters")
    .optional(),

  code: z
    .string()
    .min(2, "Area code is required")
    .max(20, "Area code cannot exceed 20 characters")
    .optional(),

  address: z
    .string()
    .max(255, "Address cannot exceed 255 characters")
    .optional(),

  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .optional(),

  feederId: z
    .string()
    .min(1, "Feeder ID is required")
    .optional(),
});

export const AreaValidation = {
  createAreaSchema,
  updateAreaSchema,
};