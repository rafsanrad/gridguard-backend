import { Router } from "express";
import { validateRequest } from "../../middleware/validateRequest";
import { OutageReportController } from "./outageReport.controller";
import { OutageReportValidation } from "./outageReport.validation";
import { auth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";

const router = Router();

router.post(
  "/",
  auth(Role.CUSTOMER),
  validateRequest(OutageReportValidation.createOutageReportSchema),
  OutageReportController.createOutageReport,
);

router.get(
  "/",
  auth(Role.ADMIN, Role.OPERATOR),
  OutageReportController.getAllOutageReports,
);

router.get(
  "/:id",
  auth(Role.ADMIN, Role.OPERATOR, Role.CUSTOMER),
  OutageReportController.getSingleOutageReport,
);

export const OutageReportRoutes = router;
