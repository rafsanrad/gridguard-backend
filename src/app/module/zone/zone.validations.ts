import { z } from "zod";

const createZoneSchema = z.object({
  name: z
    .string()
    .min(2, "Zone name must be at least 2 characters")
    .max(100, "Zone name cannot exceed 100 characters"),

  code: z
    .string()
    .min(2, "Zone code must be at least 2 characters")
    .max(50, "Zone code cannot exceed 50 characters"),

  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .optional(),
});

const updateZoneSchema = z.object({
  name: z
    .string()
    .min(2, "Zone name must be at least 2 characters")
    .max(100, "Zone name cannot exceed 100 characters")
    .optional(),

  code: z
    .string()
    .min(2, "Zone code must be at least 2 characters")
    .max(50, "Zone code cannot exceed 50 characters")
    .optional(),

  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .optional(),

  isActive: z
    .boolean()
    .optional(),
});

export const ZoneValidation = {
  createZoneSchema,
  updateZoneSchema,
};;