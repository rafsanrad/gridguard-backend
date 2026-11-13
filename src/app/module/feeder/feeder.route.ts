import { Router } from "express";

import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { validateQuery } from "../../middleware/validateQuery";

import { FeederController } from "./feeder.controller";
import { FeederValidation } from "./feeder.validation";

const router = Router();

// Create feeder - Admin only
router.post(
  "/",
  auth(Role.ADMIN),
  validateRequest(FeederValidation.createFeederSchema),
  FeederController.createFeeder,
);

// Get all feeders - PUBLIC
router.get("/", validateQuery, FeederController.getAllFeeders);

// Get single feeder - PUBLIC
router.get("/:id", FeederController.getSingleFeeder);

// Update feeder - Admin only
router.patch(
  "/:id",
  auth(Role.ADMIN),
  validateRequest(FeederValidation.updateFeederSchema),
  FeederController.updateFeeder,
);

// Delete feeder - Admin only
router.delete("/:id", auth(Role.ADMIN), FeederController.deleteFeeder);

export const FeederRoutes = router;
