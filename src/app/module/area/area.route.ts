import { Router } from "express";

import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";

import { AreaController } from "./area.controller";
import { AreaValidation } from "./area.validation";
import { validateQuery } from "../../middleware/validateQuery";

const router = Router();

router.post(
  "/",
  auth(Role.ADMIN),
  validateRequest(AreaValidation.createAreaSchema),
  AreaController.createArea,
);

router.get(
  "/",
  auth(Role.ADMIN, Role.OPERATOR),
  validateQuery,
  AreaController.getAllAreas,
);

router.get(
  "/:id",
  auth(Role.ADMIN, Role.OPERATOR),
  AreaController.getSingleArea,
);

router.patch(
  "/:id",
  auth(Role.ADMIN),
  validateRequest(AreaValidation.updateAreaSchema),
  AreaController.updateArea,
);

router.delete("/:id", auth(Role.ADMIN), AreaController.deleteArea);

export const AreaRoutes = router;
