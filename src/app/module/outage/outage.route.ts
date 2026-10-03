import { Router } from "express";

import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";

import { OutageController } from "./outage.controller";
import { OutageValidation } from "./outage.validation";
import { validateQuery } from "../../middleware/validateQuery";

const router = Router();

router.post(
  "/",
  auth(Role.ADMIN, Role.OPERATOR, Role.CUSTOMER),
  validateRequest(OutageValidation.createOutageSchema),
  OutageController.createOutage,
);

router.get(
  "/",
  auth(Role.ADMIN, Role.OPERATOR),
  validateQuery,
  OutageController.getAllOutages,
);

router.get(
  "/:id",
  auth(Role.ADMIN, Role.OPERATOR, Role.CUSTOMER),
  OutageController.getSingleOutage,
);

router.patch(
  "/:id",
  auth(Role.ADMIN, Role.OPERATOR),
  validateRequest(OutageValidation.updateOutageSchema),
  OutageController.updateOutage,
);

router.patch(
  "/:id/status",
  auth(Role.ADMIN, Role.OPERATOR),
  validateRequest(OutageValidation.updateOutageStatusSchema),
  OutageController.updateOutageStatus,
);

router.delete(
  "/:id",
  auth(Role.ADMIN, Role.OPERATOR),
  OutageController.deleteOutage,
);

export const OutageRoutes = router;
