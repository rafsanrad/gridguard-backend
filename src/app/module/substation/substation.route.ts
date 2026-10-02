import { Router } from "express";
import { validateRequest } from "../../middleware/validateRequest";
import { SubstationController } from "./substation.controller";
import { SubstationValidation } from "./substation.validation";

const router = Router();

router.post(
  "/",
  validateRequest(SubstationValidation.createSubstationSchema),
  SubstationController.createSubstation,
);

router.get("/", SubstationController.getAllSubstations);

router.get("/:id", SubstationController.getSingleSubstation);

router.patch(
  "/:id",
  validateRequest(SubstationValidation.updateSubstationSchema),
  SubstationController.updateSubstation,
);

router.delete("/:id", SubstationController.deleteSubstation);

export const SubstationRoutes = router;
