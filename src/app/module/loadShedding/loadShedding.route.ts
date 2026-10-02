import { Router } from "express";

import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";

import { LoadSheddingController } from "./loadShedding.controller";
import { LoadSheddingValidation } from "./loadShedding.validation";

const router = Router();

router.post(
  "/",
  auth(Role.ADMIN, Role.OPERATOR),
  validateRequest(LoadSheddingValidation.createLoadSheddingSchema),
  LoadSheddingController.createLoadShedding,
);

router.get(
  "/",
  auth(Role.ADMIN, Role.OPERATOR),
  LoadSheddingController.getAllLoadShedding,
);

router.get(
  "/:id",
  auth(Role.ADMIN, Role.OPERATOR),
  LoadSheddingController.getSingleLoadShedding,
);

router.patch(
  "/:id",
  auth(Role.ADMIN, Role.OPERATOR),
  validateRequest(LoadSheddingValidation.updateLoadSheddingSchema),
  LoadSheddingController.updateLoadShedding,
);

router.delete(
  "/:id",
  auth(Role.ADMIN, Role.OPERATOR),
  LoadSheddingController.deleteLoadShedding,
);

export const LoadSheddingRoutes = router;
