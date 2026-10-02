import { z } from "zod";

const createNotificationSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(150, "Title cannot exceed 150 characters"),

  message: z
    .string()
    .min(1, "Message is required")
    .max(500, "Message cannot exceed 500 characters"),

  type: z.enum([
    "LOAD_SHEDDING",
    "OUTAGE",
    "SERVICE_REQUEST",
    "PAYMENT",
    "SYSTEM",
  ]),

  userId: z
    .string()
    .min(1, "User ID is required"),
});

export const NotificationValidation = {
  createNotificationSchema,
};