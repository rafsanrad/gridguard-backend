import { Router } from "express";
import { validateRequest } from "../../middleware/validateRequest";
import { NotificationController } from "./notification.controller";
import { NotificationValidation } from "./notification.validation";
import { auth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";

const router = Router();

router.post(
  "/",
  auth(Role.ADMIN, Role.OPERATOR),
  validateRequest(NotificationValidation.createNotificationSchema),
  NotificationController.createNotification,
);

router.get(
  "/",
  auth(Role.ADMIN, Role.OPERATOR),
  NotificationController.getAllNotifications,
);

router.get(
  "/:id",
  auth(Role.ADMIN, Role.OPERATOR, Role.CUSTOMER),
  NotificationController.getSingleNotification,
);

router.patch(
  "/:id/read",
  auth(Role.ADMIN, Role.OPERATOR, Role.CUSTOMER),
  NotificationController.markNotificationAsRead,
);

export const NotificationRoutes = router;
