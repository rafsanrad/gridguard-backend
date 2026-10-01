import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";

import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";

import { AuthController } from "./auth.controller";
import { AuthValidation } from "./auth.validation";

const router = Router();

router.post(
  "/register",
  validateRequest(AuthValidation.registerCustomerSchema),
  AuthController.registerCustomer,
);

router.post(
  "/login",
  validateRequest(AuthValidation.loginUserSchema),
  AuthController.loginUser,
);

router.get(
  "/me",
  auth(Role.ADMIN, Role.OPERATOR, Role.CUSTOMER),
  AuthController.getMe,
);

router.post(
  "/refresh-token",
  AuthController.refreshToken,
);

export const AuthRoutes = router;