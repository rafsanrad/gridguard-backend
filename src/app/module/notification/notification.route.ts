import { Router } from "express";
import { validateRequest } from "../../middleware/validateRequest";
import { NotificationController } from "./notification.controller";
import { NotificationValidation } from "./notification.validation";

const router = Router();

router.post(
  "/",
  validateRequest(NotificationValidation.createNotificationSchema),
  NotificationController.createNotification,
);

router.get("/", NotificationController.getAllNotifications);

router.get("/:id", NotificationController.getSingleNotification);

router.patch("/:id/read", NotificationController.markNotificationAsRead);

export const NotificationRoutes = router;
