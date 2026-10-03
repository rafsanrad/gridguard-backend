import { Router } from "express";

import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";

import { FeederController } from "./feeder.controller";
import { FeederValidation } from "./feeder.validation";
import { validateQuery } from "../../middleware/validateQuery";

const router = Router();

router.post(
  "/",
  auth(Role.ADMIN),
  validateRequest(FeederValidation.createFeederSchema),
  FeederController.createFeeder,
);

router.get(
  "/",
  auth(Role.ADMIN, Role.OPERATOR),
  validateQuery,
  FeederController.getAllFeeders,
);

router.get(
  "/:id",
  auth(Role.ADMIN, Role.OPERATOR),
  FeederController.getSingleFeeder,
);

router.patch(
  "/:id",
  auth(Role.ADMIN),
  validateRequest(FeederValidation.updateFeederSchema),
  FeederController.updateFeeder,
);

router.delete("/:id", auth(Role.ADMIN), FeederController.deleteFeeder);

export const FeederRoutes = router;
