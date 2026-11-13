import { Request, Response } from "express";
import httpStatus from "http-status";

import { AnalyticsService } from "./analytics.service";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";

const getDashboardAnalytics = catchAsync(
  async (_req: Request, res: Response) => {
    const result = await AnalyticsService.getDashboardAnalytics();

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Dashboard analytics retrieved successfully",
      data: result,
    });
  },
);

export const AnalyticsController = {
  getDashboardAnalytics,
};
