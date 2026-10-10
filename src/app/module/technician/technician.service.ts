import { IQueryParams } from "../../interfaces/common";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { getSafeSortField } from "../../utils/query";
import { deleteCacheByPrefix, getCache, setCache } from "../../utils/cache";
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

  await deleteCacheByPrefix("technicians");

  return technician;
};

const getAllTechnicians = async (query?: IQueryParams) => {
  const page = query?.page ?? 1;
  const limit = query?.limit ?? 10;
  const skip = (page - 1) * limit;

  const search = query?.search ?? "";
  const sortBy = query?.sortBy ?? "";
  const sortOrder = query?.sortOrder ?? "desc";

  const cacheKey = `technicians:${page}:${limit}:${search}:${sortBy}:${sortOrder}`;

  const cachedData = await getCache(cacheKey);

  if (cachedData) {
    return cachedData;
  }

  const safeSortBy = getSafeSortField(
    sortBy,
    [
      "employeeId",
      "name",
      "phone",
      "specialization",
      "status",
      "createdAt",
      "updatedAt",
    ],
    "createdAt",
  );

  const where = {
    isActive: true,
    ...(search
      ? {
          OR: [
            {
              employeeId: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              name: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              phone: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              specialization: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
          ],
        }
      : {}),
  };

  const [technicians, total] = await prisma.$transaction([
    prisma.technician.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [safeSortBy]: sortOrder,
      },
    }),
    prisma.technician.count({
      where,
    }),
  ]);

  const result = {
    data: technicians,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };

  await setCache(cacheKey, result, 300);

  return result;
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

  await deleteCacheByPrefix("technicians");

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

  await deleteCacheByPrefix("technicians");

  return deletedTechnician;
};

export const TechnicianService = {
  createTechnician,
  getAllTechnicians,
  getSingleTechnician,
  updateTechnician,
  deleteTechnician,
};
