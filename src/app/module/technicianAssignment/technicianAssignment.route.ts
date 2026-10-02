import { Router } from "express";
import { validateRequest } from "../../middleware/validateRequest";
import { TechnicianAssignmentController } from "./technicianAssignment.controller";
import { TechnicianAssignmentValidation } from "./technicianAssignment.validation";

const router = Router();

router.post(
  "/",
  validateRequest(
    TechnicianAssignmentValidation.createTechnicianAssignmentSchema,
  ),
  TechnicianAssignmentController.createTechnicianAssignment,
);

router.get("/", TechnicianAssignmentController.getAllTechnicianAssignments);

router.get(
  "/:id",
  TechnicianAssignmentController.getSingleTechnicianAssignment,
);

export const TechnicianAssignmentRoutes = router;
