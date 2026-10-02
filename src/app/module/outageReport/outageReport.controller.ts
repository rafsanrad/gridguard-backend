import { Request, Response } from "express";
import httpStatus from "http-status";

import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { OutageReportService } from "./outageReport.service";

const createOutageReport = catchAsync(async (req: Request, res: Response) => {
  const result = await OutageReportService.createOutageReport(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Outage report created successfully",
    data: result,
  });
});

const getAllOutageReports = catchAsync(async (_req: Request, res: Response) => {
  const result = await OutageReportService.getAllOutageReports();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Outage reports fetched successfully",
    data: result,
  });
});

const getSingleOutageReport = catchAsync(
  async (req: Request, res: Response) => {
    const result = await OutageReportService.getSingleOutageReport(
      req.params.id as string,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Outage report fetched successfully",
      data: result,
    });
  },
);

export const OutageReportController = {
  createOutageReport,
  getAllOutageReports,
  getSingleOutageReport,
};
