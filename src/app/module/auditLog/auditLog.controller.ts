import { Request, Response } from "express";
import httpStatus from "http-status";

import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { AuditLogService } from "./auditLog.service";

const getAllAuditLogs = catchAsync(async (req: Request, res: Response) => {
  const result = await AuditLogService.getAllAuditLogs(req.validatedQuery);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Audit logs retrieved successfully",
    data: result.data,
    meta: result.meta
  });
});

export const AuditLogController = {
  getAllAuditLogs,
};
