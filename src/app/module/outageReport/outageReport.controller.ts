import { Request, Response } from "express";
import httpStatus from "http-status";

import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { OutageReportService } from "./outageReport.service";

const createOutageReport = catchAsync(async (req: Request, res: Response) => {
  const result = await OutageReportService.createOutageReport(
    req.body,
    req.user?.userId as string,
  );

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Outage report created successfully",
    data: result,
  });
});

const getAllOutageReports = catchAsync(async (req: Request, res: Response) => {
  const result = await OutageReportService.getAllOutageReports(
    req.validatedQuery,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Outage reports fetched successfully",
    data: result.data,
    meta: result.meta,
  });
});

const getSingleOutageReport = catchAsync(
  async (req: Request, res: Response) => {
    const result = await OutageReportService.getSingleOutageReport(
      req.params.id as string,
      req.user?.userId,
      req.user?.role,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Outage report retrieved successfully",
      data: result,
    });
  },
);

export const OutageReportController = {
  createOutageReport,
  getAllOutageReports,
  getSingleOutageReport,
};
