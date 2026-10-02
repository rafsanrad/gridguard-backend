import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { TechnicianAssignmentService } from "./technicianAssignment.service";

const createTechnicianAssignment = catchAsync(
  async (req: Request, res: Response) => {
    const result = await TechnicianAssignmentService.createTechnicianAssignment(
      req.body,
    );

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Technician assigned successfully",
      data: result,
    });
  },
);

const getAllTechnicianAssignments = catchAsync(
  async (_req: Request, res: Response) => {
    const result =
      await TechnicianAssignmentService.getAllTechnicianAssignments();

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Technician assignments fetched successfully",
      data: result,
    });
  },
);

const getSingleTechnicianAssignment = catchAsync(
  async (req: Request, res: Response) => {
    const result =
      await TechnicianAssignmentService.getSingleTechnicianAssignment(
        req.params.id as string,
      );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Technician assignment fetched successfully",
      data: result,
    });
  },
);

export const TechnicianAssignmentController = {
  createTechnicianAssignment,
  getAllTechnicianAssignments,
  getSingleTechnicianAssignment,
};
