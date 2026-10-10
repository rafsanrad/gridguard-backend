import { Request, Response } from "express";
import httpStatus from "http-status";
import { AnalyticsService } from "./analytics.service";

const getDashboardAnalytics = async (req: Request, res: Response) => {
  const result = await AnalyticsService.getDashboardAnalytics();

  res.status(httpStatus.OK).json({
    success: true,
    message: "Dashboard analytics retrieved successfully",
    data: result,
  });
};

export const AnalyticsController = {
  getDashboardAnalytics,
};
