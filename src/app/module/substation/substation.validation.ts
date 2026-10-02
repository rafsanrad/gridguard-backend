import { z } from "zod";

const createSubstationSchema = z.object({
  name: z
    .string()
    .min(2, "Substation name must be at least 2 characters")
    .max(100, "Substation name cannot exceed 100 characters"),

  code: z
    .string()
    .min(2, "Substation code is required")
    .max(20, "Substation code cannot exceed 20 characters"),

  address: z
    .string()
    .max(255, "Address cannot exceed 255 characters")
    .optional(),

  capacity: z
    .number()
    .positive("Capacity must be greater than 0")
    .optional(),

  zoneId: z
    .string()
    .min(1, "Zone ID is required"),
});

const updateSubstationSchema = z.object({
  name: z
    .string()
    .min(2, "Substation name must be at least 2 characters")
    .max(100, "Substation name cannot exceed 100 characters")
    .optional(),

  code: z
    .string()
    .min(2, "Substation code is required")
    .max(20, "Substation code cannot exceed 20 characters")
    .optional(),

  address: z
    .string()
    .max(255, "Address cannot exceed 255 characters")
    .optional(),

  capacity: z
    .number()
    .positive("Capacity must be greater than 0")
    .optional(),

  zoneId: z
    .string()
    .min(1, "Zone ID is required")
    .optional(),
});

export const SubstationValidation = {
  createSubstationSchema,
  updateSubstationSchema,
};