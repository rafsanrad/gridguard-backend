import { Router } from "express";

import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";

import { AuditLogController } from "./auditLog.controller";
import { validateQuery } from "../../middleware/validateQuery";

const router = Router();

router.get(
  "/",
  auth(Role.ADMIN),
  validateQuery,
  AuditLogController.getAllAuditLogs,
);

export const AuditLogRoutes = router;
