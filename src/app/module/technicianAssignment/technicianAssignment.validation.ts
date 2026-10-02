import { z } from "zod";

const createTechnicianAssignmentSchema = z.object({
  outageId: z
    .string()
    .min(1, "Outage ID is required"),

  technicianId: z
    .string()
    .min(1, "Technician ID is required"),

  assignedById: z
    .string()
    .min(1, "Assigned by user ID is required"),

  notes: z
    .string()
    .max(500, "Notes cannot exceed 500 characters")
    .optional(),
});

export const TechnicianAssignmentValidation = {
  createTechnicianAssignmentSchema,
};