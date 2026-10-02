import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { TechnicianService } from "./technician.service";

const createTechnician = catchAsync(async (req: Request, res: Response) => {
  const result = await TechnicianService.createTechnician(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Technician created successfully",
    data: result,
  });
});

const getAllTechnicians = catchAsync(async (_req: Request, res: Response) => {
  const result = await TechnicianService.getAllTechnicians();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Technicians fetched successfully",
    data: result,
  });
});

const getSingleTechnician = catchAsync(async (req: Request, res: Response) => {
  const result = await TechnicianService.getSingleTechnician(
    req.params.id as string,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Technician fetched successfully",
    data: result,
  });
});

const updateTechnician = catchAsync(async (req: Request, res: Response) => {
  const result = await TechnicianService.updateTechnician(
    req.params.id as string,
    req.body,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Technician updated successfully",
    data: result,
  });
});

const deleteTechnician = catchAsync(async (req: Request, res: Response) => {
  const result = await TechnicianService.deleteTechnician(
    req.params.id as string,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Technician deleted successfully",
    data: result,
  });
});

export const TechnicianController = {
  createTechnician,
  getAllTechnicians,
  getSingleTechnician,
  updateTechnician,
  deleteTechnician,
};
