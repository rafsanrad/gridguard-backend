import { Router } from "express";
import { validateRequest } from "../../middleware/validateRequest";
import { OutageReportController } from "./outageReport.controller";
import { OutageReportValidation } from "./outageReport.validation";
import { auth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";
import { validateQuery } from "../../middleware/validateQuery";

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
  validateQuery,
  OutageReportController.getAllOutageReports,
);

router.get(
  "/:id",
  auth(Role.ADMIN, Role.OPERATOR, Role.CUSTOMER),
  OutageReportController.getSingleOutageReport,
);

export const OutageReportRoutes = router;
