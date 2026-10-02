import { z } from "zod";

const createZoneSchema = z.object({
  name: z
    .string()
    .min(3, "Zone name must be at least 3 characters"),

  code: z
    .string()
    .min(2, "Zone code is required")
    .max(20, "Zone code cannot exceed 20 characters"),
});

export const ZoneValidation = {
  createZoneSchema,
};