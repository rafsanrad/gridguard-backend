import { z } from "zod";

const createTechnicianSchema = z.object({
  employeeId: z
    .string()
    .min(2, "Employee ID is required")
    .max(30, "Employee ID cannot exceed 30 characters"),

  name: z
    .string()
    .min(2, "Technician name must be at least 2 characters")
    .max(100, "Technician name cannot exceed 100 characters"),

  phone: z
    .string()
    .min(10, "Phone number must be at least 10 characters")
    .max(20, "Phone number cannot exceed 20 characters"),

  specialization: z
    .string()
    .max(100, "Specialization cannot exceed 100 characters")
    .optional(),
});

const updateTechnicianSchema = z.object({
  employeeId: z
    .string()
    .min(2, "Employee ID is required")
    .max(30, "Employee ID cannot exceed 30 characters")
    .optional(),

  name: z
    .string()
    .min(2, "Technician name must be at least 2 characters")
    .max(100, "Technician name cannot exceed 100 characters")
    .optional(),

  phone: z
    .string()
    .min(10, "Phone number must be at least 10 characters")
    .max(20, "Phone number cannot exceed 20 characters")
    .optional(),

  specialization: z
    .string()
    .max(100, "Specialization cannot exceed 100 characters")
    .optional(),
});

export const TechnicianValidation = {
  createTechnicianSchema,
  updateTechnicianSchema,
};