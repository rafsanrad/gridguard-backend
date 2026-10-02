import { z } from "zod";

const createFeederSchema = z.object({
  name: z
    .string()
    .min(2, "Feeder name must be at least 2 characters")
    .max(100, "Feeder name cannot exceed 100 characters"),

  code: z
    .string()
    .min(2, "Feeder code is required")
    .max(20, "Feeder code cannot exceed 20 characters"),

  voltageLevel: z
    .string()
    .max(50, "Voltage level cannot exceed 50 characters")
    .optional(),

  substationId: z
    .string()
    .min(1, "Substation ID is required"),
});

const updateFeederSchema = z.object({
  name: z
    .string()
    .min(2, "Feeder name must be at least 2 characters")
    .max(100, "Feeder name cannot exceed 100 characters")
    .optional(),

  code: z
    .string()
    .min(2, "Feeder code is required")
    .max(20, "Feeder code cannot exceed 20 characters")
    .optional(),

  voltageLevel: z
    .string()
    .max(50, "Voltage level cannot exceed 50 characters")
    .optional(),

  substationId: z
    .string()
    .min(1, "Substation ID is required")
    .optional(),
});

export const FeederValidation = {
  createFeederSchema,
  updateFeederSchema,
};