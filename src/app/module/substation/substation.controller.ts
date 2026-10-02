import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { SubstationService } from "./substation.service";

const createSubstation = catchAsync(async (req: Request, res: Response) => {
  const result = await SubstationService.createSubstation(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Substation created successfully",
    data: result,
  });
});

const getAllSubstations = catchAsync(async (_req: Request, res: Response) => {
  const result = await SubstationService.getAllSubstations();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Substations fetched successfully",
    data: result,
  });
});

const getSingleSubstation = catchAsync(async (req: Request, res: Response) => {
  const result = await SubstationService.getSingleSubstation(
    req.params.id as string,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Substation fetched successfully",
    data: result,
  });
});

const updateSubstation = catchAsync(async (req: Request, res: Response) => {
  const result = await SubstationService.updateSubstation(
    req.params.id as string,
    req.body,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Substation updated successfully",
    data: result,
  });
});

const deleteSubstation = catchAsync(async (req: Request, res: Response) => {
  const result = await SubstationService.deleteSubstation(
    req.params.id as string,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Substation deleted successfully",
    data: result,
  });
});

export const SubstationController = {
  createSubstation,
  getAllSubstations,
  getSingleSubstation,
  updateSubstation,
  deleteSubstation,
};
