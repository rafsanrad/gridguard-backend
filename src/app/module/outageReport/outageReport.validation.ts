import { z } from "zod";

const createOutageReportSchema = z.object({
  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .optional(),

  location: z
    .string()
    .max(255, "Location cannot exceed 255 characters")
    .optional(),

  outageId: z
    .string()
    .optional(),
});

export const OutageReportValidation = {
  createOutageReportSchema,
};