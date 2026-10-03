import { Router } from "express";

import { auth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";
import { validateRequest } from "../../middleware/validateRequest";

import { TechnicianAssignmentController } from "./technicianAssignment.controller";
import { TechnicianAssignmentValidation } from "./technicianAssignment.validation";
import { validateQuery } from "../../middleware/validateQuery";

const router = Router();

router.post(
  "/",
  auth(Role.ADMIN, Role.OPERATOR),
  validateRequest(
    TechnicianAssignmentValidation.createTechnicianAssignmentSchema,
  ),
  TechnicianAssignmentController.createTechnicianAssignment,
);

router.get(
  "/",
  auth(Role.ADMIN, Role.OPERATOR),
  validateQuery,
  TechnicianAssignmentController.getAllTechnicianAssignments,
);

router.get(
  "/:id",
  auth(Role.ADMIN, Role.OPERATOR),
  TechnicianAssignmentController.getSingleTechnicianAssignment,
);

export const TechnicianAssignmentRoutes = router;
