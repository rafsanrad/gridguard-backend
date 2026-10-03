import { IQueryParams } from "../../interfaces/common";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { getSafeSortField } from "../../utils/query";
import {
  ICreateSubstationPayload,
  IUpdateSubstationPayload,
} from "./substation.interface";

const createSubstation = async (payload: ICreateSubstationPayload) => {
  const zone = await prisma.zone.findUnique({
    where: {
      id: payload.zoneId,
    },
  });

  if (!zone) {
    throw new AppError(404, "Zone not found");
  }

  if (!zone.isActive) {
    throw new AppError(400, "Cannot create substation under an inactive zone");
  }

  const existingSubstation = await prisma.substation.findUnique({
    where: {
      code: payload.code,
    },
  });

  if (existingSubstation) {
    throw new AppError(409, "Substation code already exists");
  }

  const substation = await prisma.substation.create({
    data: {
      name: payload.name,
      code: payload.code,
      address: payload.address,
      capacity: payload.capacity,
      zoneId: payload.zoneId,
    },
  });

  return substation;
};

const getAllSubstations = async (query?: IQueryParams) => {
  const page = query?.page ?? 1;
  const limit = query?.limit ?? 10;
  const skip = (page - 1) * limit;

  const search = query?.search;
  const sortBy = query?.sortBy;
  const sortOrder = query?.sortOrder ?? "desc";

  const safeSortBy = getSafeSortField(
    sortBy,
    ["name", "code", "createdAt", "updatedAt"],
    "createdAt",
  );

  const where = {
    isActive: true,

    ...(search
      ? {
          OR: [
            {
              name: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              code: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              address: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
          ],
        }
      : {}),
  };

  const [substations, total] = await prisma.$transaction([
    prisma.substation.findMany({
      where,
      skip,
      take: limit,

      include: {
        zone: true,
      },

      orderBy: {
        [safeSortBy]: sortOrder,
      },
    }),

    prisma.substation.count({
      where,
    }),
  ]);

  return {
    data: substations,

    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getSingleSubstation = async (id: string) => {
  const substation = await prisma.substation.findUnique({
    where: {
      id,
    },

    include: {
      zone: true,
    },
  });

  if (!substation) {
    throw new AppError(404, "Substation not found");
  }

  return substation;
};

const updateSubstation = async (
  id: string,
  payload: IUpdateSubstationPayload,
) => {
  const existingSubstation = await prisma.substation.findUnique({
    where: {
      id,
    },
  });

  if (!existingSubstation) {
    throw new AppError(404, "Substation not found");
  }

  if (payload.code) {
    const duplicateSubstation = await prisma.substation.findFirst({
      where: {
        code: payload.code,

        NOT: {
          id,
        },
      },
    });

    if (duplicateSubstation) {
      throw new AppError(409, "Substation code already exists");
    }
  }

  if (payload.zoneId) {
    const zone = await prisma.zone.findUnique({
      where: {
        id: payload.zoneId,
      },
    });

    if (!zone) {
      throw new AppError(404, "Zone not found");
    }

    if (!zone.isActive) {
      throw new AppError(400, "Cannot move substation to an inactive zone");
    }
  }

  const updatedSubstation = await prisma.substation.update({
    where: {
      id,
    },

    data: payload,
  });

  return updatedSubstation;
};

const deleteSubstation = async (id: string) => {
  const existingSubstation = await prisma.substation.findUnique({
    where: {
      id,
    },
  });

  if (!existingSubstation) {
    throw new AppError(404, "Substation not found");
  }

  const deletedSubstation = await prisma.substation.update({
    where: {
      id,
    },

    data: {
      isActive: false,
    },
  });

  return deletedSubstation;
};

export const SubstationService = {
  createSubstation,
  getAllSubstations,
  getSingleSubstation,
  updateSubstation,
  deleteSubstation,
};
