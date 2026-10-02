import { Router } from "express";
import { validateRequest } from "../../middleware/validateRequest";
import { LoadSheddingController } from "./loadShedding.controller";
import { LoadSheddingValidation } from "./loadShedding.validation";

const router = Router();

router.post(
  "/",
  validateRequest(LoadSheddingValidation.createLoadSheddingSchema),
  LoadSheddingController.createLoadShedding,
);

router.get("/", LoadSheddingController.getAllLoadShedding);

router.get("/:id", LoadSheddingController.getSingleLoadShedding);

router.patch(
  "/:id",
  validateRequest(LoadSheddingValidation.updateLoadSheddingSchema),
  LoadSheddingController.updateLoadShedding,
);

router.delete("/:id", LoadSheddingController.deleteLoadShedding);

export const LoadSheddingRoutes = router;
