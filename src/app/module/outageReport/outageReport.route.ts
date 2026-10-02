import { Router } from "express";
import { validateRequest } from "../../middleware/validateRequest";
import { OutageReportController } from "./outageReport.controller";
import { OutageReportValidation } from "./outageReport.validation";

const router = Router();

router.post(
  "/",
  validateRequest(OutageReportValidation.createOutageReportSchema),
  OutageReportController.createOutageReport,
);

router.get("/", OutageReportController.getAllOutageReports);

router.get("/:id", OutageReportController.getSingleOutageReport);

export const OutageReportRoutes = router;
