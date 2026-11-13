
import { Router } from "express";

import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { validateQuery } from "../../middleware/validateQuery";

import { OutageController } from "./outage.controller";
import { OutageValidation } from "./outage.validation";

const router = Router();

// Create outage - authenticated users only
router.post(
  "/",
  auth(Role.ADMIN, Role.OPERATOR, Role.CUSTOMER),
  validateRequest(OutageValidation.createOutageSchema),
  OutageController.createOutage,
);

// Get all outages - PUBLIC
router.get(
  "/",
  validateQuery,
  OutageController.getAllOutages,
);

// Get single outage - PUBLIC
router.get(
  "/:id",
  OutageController.getSingleOutage,
);

// Update outage - Admin and Operator
router.patch(
  "/:id",
  auth(Role.ADMIN, Role.OPERATOR),
  validateRequest(OutageValidation.updateOutageSchema),
  OutageController.updateOutage,
);

// Update outage status - Admin and Operator
router.patch(
  "/:id/status",
  auth(Role.ADMIN, Role.OPERATOR),
  validateRequest(OutageValidation.updateOutageStatusSchema),
  OutageController.updateOutageStatus,
);

// Delete outage - Admin and Operator
router.delete(
  "/:id",
  auth(Role.ADMIN, Role.OPERATOR),
  OutageController.deleteOutage,
);

export const OutageRoutes = router;
