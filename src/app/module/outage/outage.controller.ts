import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { OutageService } from "./outage.service";

const createOutage = catchAsync(async (req: Request, res: Response) => {
  const result = await OutageService.createOutage(
    req.body,
    req.user?.userId as string,
  );

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Outage created successfully",
    data: result,
  });
});

const getAllOutages = catchAsync(async (_req: Request, res: Response) => {
  const result = await OutageService.getAllOutages();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Outages fetched successfully",
    data: result,
  });
});

const getSingleOutage = catchAsync(async (req: Request, res: Response) => {
  const result = await OutageService.getSingleOutage(req.params.id as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Outage fetched successfully",
    data: result,
  });
});

const updateOutage = catchAsync(async (req: Request, res: Response) => {
  const result = await OutageService.updateOutage(
    req.params.id as string,
    req.body,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Outage updated successfully",
    data: result,
  });
});

const updateOutageStatus = catchAsync(async (req: Request, res: Response) => {
  const result = await OutageService.updateOutageStatus(
    req.params.id as string,
    req.body,
    req.user?.userId as string,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Outage status updated successfully",
    data: result,
  });
});

const deleteOutage = catchAsync(async (req: Request, res: Response) => {
  const result = await OutageService.deleteOutage(req.params.id as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Outage deleted successfully",
    data: result,
  });
});

export const OutageController = {
  createOutage,
  getAllOutages,
  getSingleOutage,
  updateOutage,
  updateOutageStatus,
  deleteOutage,
};
