import { Router } from "express";

import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";

import { AuditLogController } from "./auditLog.controller";

const router = Router();

router.get("/", auth(Role.ADMIN), AuditLogController.getAllAuditLogs);

export const AuditLogRoutes = router;
