import { Router } from "express";
import { validateRequest } from "../../middleware/validateRequest";
import { FeederController } from "./feeder.controller";
import { FeederValidation } from "./feeder.validation";

const router = Router();

router.post(
  "/",
  validateRequest(FeederValidation.createFeederSchema),
  FeederController.createFeeder,
);

router.get("/", FeederController.getAllFeeders);

router.get("/:id", FeederController.getSingleFeeder);

router.patch(
  "/:id",
  validateRequest(FeederValidation.updateFeederSchema),
  FeederController.updateFeeder,
);

router.delete("/:id", FeederController.deleteFeeder);

export const FeederRoutes = router;
