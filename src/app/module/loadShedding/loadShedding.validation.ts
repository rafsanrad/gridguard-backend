import { z } from "zod";

const createLoadSheddingSchema = z
  .object({
    title: z
      .string()
      .min(3, "Title must be at least 3 characters")
      .max(150, "Title cannot exceed 150 characters"),

    description: z
      .string()
      .max(500, "Description cannot exceed 500 characters")
      .optional(),

    startDateTime: z.coerce.date({
      error: "Start date and time is required",
    }),

    endDateTime: z.coerce.date({
      error: "End date and time is required",
    }),

    reason: z
      .string()
      .max(255, "Reason cannot exceed 255 characters")
      .optional(),

    feederId: z
      .string()
      .min(1, "Feeder ID is required"),

    createdById: z
      .string()
      .min(1, "Creator ID is required"),
  })
  .refine(
    (data) => data.endDateTime > data.startDateTime,
    {
      message: "End date and time must be after start date and time",
      path: ["endDateTime"],
    },
  );

const updateLoadSheddingSchema = z
  .object({
    title: z
      .string()
      .min(3, "Title must be at least 3 characters")
      .max(150, "Title cannot exceed 150 characters")
      .optional(),

    description: z
      .string()
      .max(500, "Description cannot exceed 500 characters")
      .optional(),

    startDateTime: z.coerce.date().optional(),

    endDateTime: z.coerce.date().optional(),

    reason: z
      .string()
      .max(255, "Reason cannot exceed 255 characters")
      .optional(),
  })
  .refine(
    (data) => {
      if (data.startDateTime && data.endDateTime) {
        return data.endDateTime > data.startDateTime;
      }

      return true;
    },
    {
      message: "End date and time must be after start date and time",
      path: ["endDateTime"],
    },
  );

export const LoadSheddingValidation = {
  createLoadSheddingSchema,
  updateLoadSheddingSchema,
};