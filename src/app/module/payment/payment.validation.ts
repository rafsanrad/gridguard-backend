import { z } from "zod";

const createPaymentSchema = z.object({
  serviceRequestId: z
    .string()
    .min(1, "Service request ID is required"),

  customerId: z
    .string()
    .min(1, "Customer ID is required"),
});

export const PaymentValidation = {
  createPaymentSchema,
};