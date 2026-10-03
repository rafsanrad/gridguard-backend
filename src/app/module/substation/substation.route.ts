import { Router } from "express";

import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";

import { SubstationController } from "./substation.controller";
import { SubstationValidation } from "./substation.validation";
import { validateQuery } from "../../middleware/validateQuery";

const router = Router();

router.post(
  "/",
  auth(Role.ADMIN),
  validateRequest(SubstationValidation.createSubstationSchema),
  SubstationController.createSubstation,
);

router.get(
  "/",
  auth(Role.ADMIN, Role.OPERATOR),
  validateQuery,
  SubstationController.getAllSubstations,
);

router.get(
  "/:id",
  auth(Role.ADMIN, Role.OPERATOR),
  SubstationController.getSingleSubstation,
);

router.patch(
  "/:id",
  auth(Role.ADMIN),
  validateRequest(SubstationValidation.updateSubstationSchema),
  SubstationController.updateSubstation,
);

router.delete("/:id", auth(Role.ADMIN), SubstationController.deleteSubstation);

export const SubstationRoutes = router;
