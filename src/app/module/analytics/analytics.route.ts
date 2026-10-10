import { Router } from "express";
import { AnalyticsController } from "./analytics.controller";
import { auth } from "../../middleware/checkAuth";

const router = Router();

router.get(
  "/dashboard",
  auth("ADMIN", "OPERATOR"),
  AnalyticsController.getDashboardAnalytics,
);

export const AnalyticsRoutes = router;
