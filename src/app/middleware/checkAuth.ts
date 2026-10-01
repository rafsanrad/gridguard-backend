import { NextFunction, Request, Response } from "express";
import { JwtPayload } from "jsonwebtoken";

import { Role, UserStatus } from "../../generated/prisma/enums";
import config from "../config";
import { prisma } from "../lib/prisma";
import { catchAsync } from "../utils/catchAsync";
import { jwtUtils } from "../utils/jwt";
import { AppError } from "../utils/AppError";

declare global {
  namespace Express {
    interface Request {
      user?: {
        email: string;
        name: string;
        userId: string;
        role: Role;
      };
    }
  }
}

export const auth = (...requiredRoles: Role[]) => {
  return catchAsync(
    async (req: Request, _res: Response, next: NextFunction) => {
      const token = req.cookies.accessToken
        ? req.cookies.accessToken
        : req.headers.authorization?.startsWith("Bearer ")
          ? req.headers.authorization.split(" ")[1]
          : req.headers.authorization;

      if (!token) {
        throw new AppError(
          401,
          "You are not logged in. Please log in to access this resource.",
        );
      }

      const verifiedToken = jwtUtils.verifyToken(
        token,
        config.jwt_access_secret,
      );

      if (!verifiedToken.success || !verifiedToken.data) {
        throw new AppError(
          401,
          verifiedToken.error || "Invalid or expired access token",
        );
      }

      const { email, name, userId, role } =
        verifiedToken.data as JwtPayload;

      if (!userId || !email || !name || !role) {
        throw new AppError(401, "Invalid authentication token");
      }

      if (
        requiredRoles.length > 0 &&
        !requiredRoles.includes(role as Role)
      ) {
        throw new AppError(
          403,
          "Forbidden. You don't have permission to access this resource.",
        );
      }

      const user = await prisma.user.findUnique({
        where: {
          id: userId,
        },
      });

      if (!user) {
        throw new AppError(
          401,
          "User not found. Please log in again.",
        );
      }

      if (user.status === UserStatus.BLOCKED) {
        throw new AppError(
          403,
          "Your account has been blocked. Please contact support.",
        );
      }

      if (
        user.status === UserStatus.DELETED ||
        user.deletedAt
      ) {
        throw new AppError(
          403,
          "Your account has been deleted.",
        );
      }

      req.user = {
        email: user.email,
        name: user.name,
        userId: user.id,
        role: user.role,
      };

      next();
    },
  );
};