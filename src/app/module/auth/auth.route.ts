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
  "/verify-email",
  validateRequest(AuthValidation.verifyEmailSchema),
  AuthController.verifyEmail,
);

router.post(
  "/verify-email-otp",
  validateRequest(AuthValidation.verifyEmailOtpSchema),
  AuthController.verifyEmailOtp,
);

router.post(
  "/login",
  validateRequest(AuthValidation.loginUserSchema),
  AuthController.loginUser,
);

router.post(
  "/google-login",
  validateRequest(AuthValidation.googleLoginSchema),
  AuthController.googleLogin,
);

router.get(
  "/google",
  AuthController.googleAuth,
);

router.get(
  "/google/callback",
  AuthController.googleCallback,
);

router.post(
  "/forgot-password",
  validateRequest(AuthValidation.forgotPasswordSchema),
  AuthController.forgotPassword,
);

router.post(
  "/reset-password",
  validateRequest(AuthValidation.resetPasswordSchema),
  AuthController.resetPassword,
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