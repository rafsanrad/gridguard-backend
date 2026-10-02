import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import {
  ICreateTechnicianPayload,
  IUpdateTechnicianPayload,
} from "./technician.interface";

const createTechnician = async (payload: ICreateTechnicianPayload) => {
  const existingTechnician = await prisma.technician.findUnique({
    where: {
      employeeId: payload.employeeId,
    },
  });

  if (existingTechnician) {
    throw new AppError(409, "Employee ID already exists");
  }

  const technician = await prisma.technician.create({
    data: payload,
  });

  return technician;
};

const getAllTechnicians = async () => {
  const technicians = await prisma.technician.findMany({
    where: {
      isActive: true,
    },

    orderBy: {
      createdAt: "desc",
    },
  });

  return technicians;
};

const getSingleTechnician = async (id: string) => {
  const technician = await prisma.technician.findUnique({
    where: {
      id,
    },
  });

  if (!technician) {
    throw new AppError(404, "Technician not found");
  }

  return technician;
};

const updateTechnician = async (
  id: string,
  payload: IUpdateTechnicianPayload,
) => {
  const existingTechnician = await prisma.technician.findUnique({
    where: {
      id,
    },
  });

  if (!existingTechnician) {
    throw new AppError(404, "Technician not found");
  }

  if (payload.employeeId) {
    const duplicateTechnician = await prisma.technician.findFirst({
      where: {
        employeeId: payload.employeeId,

        NOT: {
          id,
        },
      },
    });

    if (duplicateTechnician) {
      throw new AppError(409, "Employee ID already exists");
    }
  }

  const updatedTechnician = await prisma.technician.update({
    where: {
      id,
    },

    data: payload,
  });

  return updatedTechnician;
};

const deleteTechnician = async (id: string) => {
  const existingTechnician = await prisma.technician.findUnique({
    where: {
      id,
    },
  });

  if (!existingTechnician) {
    throw new AppError(404, "Technician not found");
  }

  const deletedTechnician = await prisma.technician.update({
    where: {
      id,
    },

    data: {
      isActive: false,
    },
  });

  return deletedTechnician;
};

export const TechnicianService = {
  createTechnician,
  getAllTechnicians,
  getSingleTechnician,
  updateTechnician,
  deleteTechnician,
};
