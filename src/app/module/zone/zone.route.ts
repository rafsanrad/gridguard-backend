import { Router } from "express";

import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { ZoneController } from "./zone.controller";
import { ZoneValidation } from "./zone.validations";
import { validateQuery } from "../../middleware/validateQuery";


const router = Router();

router.post(
  "/",
  auth(Role.ADMIN),
  validateRequest(ZoneValidation.createZoneSchema),
  ZoneController.createZone,
);

router.get(
  "/",
  auth(Role.ADMIN, Role.OPERATOR),
  validateQuery,
  ZoneController.getAllZones,
);

router.get(
  "/:id",
  auth(Role.ADMIN, Role.OPERATOR),
  ZoneController.getSingleZone,
);

router.patch(
  "/:id",
  auth(Role.ADMIN),
  validateRequest(ZoneValidation.updateZoneSchema),
  ZoneController.updateZone,
);

router.delete("/:id", auth(Role.ADMIN), ZoneController.deleteZone);

export const ZoneRoutes = router;
