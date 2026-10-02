import { Router } from "express";
import { ZoneController } from "./zone.controller";

const router = Router();

router.post(
  "/",
  ZoneController.createZone,
);

router.get(
  "/",
  ZoneController.getAllZones,
);

router.get(
  "/:id",
  ZoneController.getSingleZone,
);

router.patch(
  "/:id",
  ZoneController.updateZone,
);

router.delete(
  "/:id",
  ZoneController.deleteZone,
);

export const ZoneRoutes = router;