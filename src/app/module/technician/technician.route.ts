import { Router } from "express";
import { validateRequest } from "../../middleware/validateRequest";
import { TechnicianController } from "./technician.controller";
import { TechnicianValidation } from "./technician.validation";

const router = Router();

router.post(
  "/",
  validateRequest(TechnicianValidation.createTechnicianSchema),
  TechnicianController.createTechnician,
);

router.get("/", TechnicianController.getAllTechnicians);

router.get("/:id", TechnicianController.getSingleTechnician);

router.patch(
  "/:id",
  validateRequest(TechnicianValidation.updateTechnicianSchema),
  TechnicianController.updateTechnician,
);

router.delete("/:id", TechnicianController.deleteTechnician);

export const TechnicianRoutes = router;
