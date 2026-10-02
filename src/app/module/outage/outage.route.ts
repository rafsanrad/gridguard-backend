import { Router } from "express";
import { validateRequest } from "../../middleware/validateRequest";
import { OutageController } from "./outage.controller";
import { OutageValidation } from "./outage.validation";

const router = Router();

router.post(
  "/",
  validateRequest(OutageValidation.createOutageSchema),
  OutageController.createOutage,
);

router.get("/", OutageController.getAllOutages);

router.get("/:id", OutageController.getSingleOutage);

router.patch(
  "/:id",
  validateRequest(OutageValidation.updateOutageSchema),
  OutageController.updateOutage,
);

router.patch(
  "/:id/status",
  validateRequest(OutageValidation.updateOutageStatusSchema),
  OutageController.updateOutageStatus,
);

router.delete("/:id", OutageController.deleteOutage);

export const OutageRoutes = router;
