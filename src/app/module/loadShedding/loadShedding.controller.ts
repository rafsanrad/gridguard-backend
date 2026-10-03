import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { LoadSheddingService } from "./loadShedding.service";

const createLoadShedding = catchAsync(async (req: Request, res: Response) => {
  const result = await LoadSheddingService.createLoadShedding(
    req.body,
    req.user?.userId as string,
  );

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Load shedding schedule created successfully",
    data: result,
  });
});

const getAllLoadShedding = catchAsync(async (req: Request, res: Response) => {
  const result = await LoadSheddingService.getAllLoadShedding(req.validatedQuery);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Load shedding schedules fetched successfully",
    data: result,
  });
});

const getSingleLoadShedding = catchAsync(
  async (req: Request, res: Response) => {
    const result = await LoadSheddingService.getSingleLoadShedding(
      req.params.id as string,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Load shedding schedule fetched successfully",
      data: result,
    });
  },
);

const updateLoadShedding = catchAsync(async (req: Request, res: Response) => {
  const result = await LoadSheddingService.updateLoadShedding(
    req.params.id as string,
    req.body,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Load shedding schedule updated successfully",
    data: result,
  });
});

const deleteLoadShedding = catchAsync(async (req: Request, res: Response) => {
  const result = await LoadSheddingService.deleteLoadShedding(
    req.params.id as string,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Load shedding schedule cancelled successfully",
    data: result,
  });
});

export const LoadSheddingController = {
  createLoadShedding,
  getAllLoadShedding,
  getSingleLoadShedding,
  updateLoadShedding,
  deleteLoadShedding,
};
