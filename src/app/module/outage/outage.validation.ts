import { z } from "zod";

const createOutageSchema = z
  .object({
    title: z
      .string()
      .min(3, "Title must be at least 3 characters")
      .max(150, "Title cannot exceed 150 characters"),

    description: z
      .string()
      .max(500, "Description cannot exceed 500 characters")
      .optional(),

    type: z.enum(["PLANNED", "UNPLANNED"]),

    startedAt: z.coerce.date({
      error: "Start date and time is required",
    }),

    estimatedRestoredAt: z.coerce.date().optional(),

    cause: z
      .string()
      .max(255, "Cause cannot exceed 255 characters")
      .optional(),

    affectedCustomers: z
      .number()
      .int()
      .nonnegative("Affected customers cannot be negative")
      .optional(),

    feederId: z
      .string()
      .min(1, "Feeder ID is required"),
  })
  .refine(
    (data) => {
      if (data.estimatedRestoredAt) {
        return data.estimatedRestoredAt > data.startedAt;
      }

      return true;
    },
    {
      message:
        "Estimated restored time must be after start time",
      path: ["estimatedRestoredAt"],
    },
  );

const updateOutageSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(150, "Title cannot exceed 150 characters")
    .optional(),

  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .optional(),

  estimatedRestoredAt: z.coerce.date().optional(),

  cause: z
    .string()
    .max(255, "Cause cannot exceed 255 characters")
    .optional(),

  affectedCustomers: z
    .number()
    .int()
    .nonnegative("Affected customers cannot be negative")
    .optional(),
});

const updateOutageStatusSchema = z.object({
  status: z.enum([
    "REPORTED",
    "ACKNOWLEDGED",
    "ASSIGNED",
    "INVESTIGATING",
    "REPAIRING",
    "RESTORED",
    "CLOSED",
  ]),

  notes: z
    .string()
    .max(500, "Notes cannot exceed 500 characters")
    .optional(),
});

export const OutageValidation = {
  createOutageSchema,
  updateOutageSchema,
  updateOutageStatusSchema,
};