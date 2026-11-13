import { Router } from "express";

import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { validateQuery } from "../../middleware/validateQuery";

import { LoadSheddingController } from "./loadShedding.controller";
import { LoadSheddingValidation } from "./loadShedding.validation";

const router = Router();

// Create schedule - Admin and Operator
router.post(
  "/",
  auth(Role.ADMIN, Role.OPERATOR),
  validateRequest(LoadSheddingValidation.createLoadSheddingSchema),
  LoadSheddingController.createLoadShedding,
);

// Get all schedules - PUBLIC
router.get("/", validateQuery, LoadSheddingController.getAllLoadShedding);

// Get single schedule - PUBLIC
router.get("/:id", LoadSheddingController.getSingleLoadShedding);

// Update schedule - Admin and Operator
router.patch(
  "/:id",
  auth(Role.ADMIN, Role.OPERATOR),
  validateRequest(LoadSheddingValidation.updateLoadSheddingSchema),
  LoadSheddingController.updateLoadShedding,
);

// Cancel schedule - Admin and Operator
router.delete(
  "/:id",
  auth(Role.ADMIN, Role.OPERATOR),
  LoadSheddingController.deleteLoadShedding,
);

export const LoadSheddingRoutes = router;
