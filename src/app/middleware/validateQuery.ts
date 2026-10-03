import { NextFunction, Request, Response } from "express";

import { querySchema } from "../utils/queryValidation";
import { AppError } from "../utils/AppError";
import { catchAsync } from "../utils/catchAsync";

declare global {
  namespace Express {
    interface Request {
      validatedQuery?: {
        page: number;
        limit: number;
        search?: string;
        sortBy?: string;
        sortOrder: "asc" | "desc";
      };
    }
  }
}

export const validateQuery = catchAsync(
  async (req: Request, _res: Response, next: NextFunction) => {
    const result = querySchema.safeParse(req.query);

    if (!result.success) {
      throw new AppError(400, result.error.issues[0].message);
    }

    req.validatedQuery = result.data;

    next();
  },
);
