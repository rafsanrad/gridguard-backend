import { Router } from "express";

import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";

import { TechnicianController } from "./technician.controller";
import { TechnicianValidation } from "./technician.validation";
import { validateQuery } from "../../middleware/validateQuery";

const router = Router();

router.post(
  "/",
  auth(Role.ADMIN, Role.OPERATOR),
  validateRequest(TechnicianValidation.createTechnicianSchema),
  TechnicianController.createTechnician,
);

router.get(
  "/",
  auth(Role.ADMIN, Role.OPERATOR),
  validateQuery,
  TechnicianController.getAllTechnicians,
);

router.get(
  "/:id",
  auth(Role.ADMIN, Role.OPERATOR),
  TechnicianController.getSingleTechnician,
);

router.patch(
  "/:id",
  auth(Role.ADMIN, Role.OPERATOR),
  validateRequest(TechnicianValidation.updateTechnicianSchema),
  TechnicianController.updateTechnician,
);

router.delete("/:id", auth(Role.ADMIN), TechnicianController.deleteTechnician);

export const TechnicianRoutes = router;
