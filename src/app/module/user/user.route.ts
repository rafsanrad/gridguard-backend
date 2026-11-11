import { Router } from "express";
import { UserController } from "./user.controller";
import { UserValidation } from "./user.validation";
import { auth } from "../../middleware/checkAuth";
import { validateQuery } from "../../middleware/validateQuery";
import { validateRequest } from "../../middleware/validateRequest";

import { Role } from "../../../generated/prisma/enums";

const router = Router();

// Admin only
router.get("/", auth(Role.ADMIN), validateQuery, UserController.getAllUsers);

// Admin and Operator - Notification recipients
// IMPORTANT: Keep this before /:id
router.get(
  "/recipients",
  auth(Role.ADMIN, Role.OPERATOR),
  validateQuery,
  UserController.getNotificationRecipients,
);

// Dynamic routes
router.get("/:id", auth(Role.ADMIN), UserController.getSingleUser);

router.patch(
  "/:id/status",
  auth(Role.ADMIN),
  validateRequest(UserValidation.updateUserStatusSchema),
  UserController.updateUserStatus,
);

router.patch(
  "/:id",
  auth(Role.ADMIN),
  validateRequest(UserValidation.updateUserSchema),
  UserController.updateUser,
);

router.delete("/:id", auth(Role.ADMIN), UserController.deleteUser);

export const UserRoutes = router;
