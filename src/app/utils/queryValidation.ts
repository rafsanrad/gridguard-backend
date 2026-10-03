import { z } from "zod";

export const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),

  limit: z.coerce.number().int().min(1).max(100).default(10),

  search: z.string().optional(),

  sortBy: z.string().optional(),

  sortOrder: z.enum(["asc", "desc"]).default("desc"),

  role: z.enum(["CUSTOMER", "OPERATOR", "ADMIN"]).optional(),
});
