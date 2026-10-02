import { Router } from "express";
import { validateRequest } from "../../middleware/validateRequest";
import { AreaController } from "./area.controller";
import { AreaValidation } from "./area.validation";

const router = Router();

router.post(
  "/",
  validateRequest(AreaValidation.createAreaSchema),
  AreaController.createArea,
);

router.get("/", AreaController.getAllAreas);

router.get("/:id", AreaController.getSingleArea);

router.patch(
  "/:id",
  validateRequest(AreaValidation.updateAreaSchema),
  AreaController.updateArea,
);

router.delete("/:id", AreaController.deleteArea);

export const AreaRoutes = router;
