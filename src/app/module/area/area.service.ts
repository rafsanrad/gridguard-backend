import { IQueryParams } from "../../interfaces/common";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { getSafeSortField } from "../../utils/query";
import { ICreateAreaPayload, IUpdateAreaPayload } from "./area.interface";

const createArea = async (payload: ICreateAreaPayload) => {
  const feeder = await prisma.feeder.findUnique({
    where: {
      id: payload.feederId,
    },
  });

  if (!feeder) {
    throw new AppError(404, "Feeder not found");
  }

  if (!feeder.isActive) {
    throw new AppError(400, "Cannot create area under an inactive feeder");
  }

  const existingArea = await prisma.area.findUnique({
    where: {
      code: payload.code,
    },
  });

  if (existingArea) {
    throw new AppError(409, "Area code already exists");
  }

  const area = await prisma.area.create({
    data: {
      name: payload.name,
      code: payload.code,
      address: payload.address,
      description: payload.description,
      feederId: payload.feederId,
    },
  });

  return area;
};

const getAllAreas = async (query?: IQueryParams) => {
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
            {
              description: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
          ],
        }
      : {}),
  };

  const [areas, total] = await prisma.$transaction([
    prisma.area.findMany({
      where,
      skip,
      take: limit,

      include: {
        feeder: {
          include: {
            substation: {
              include: {
                zone: true,
              },
            },
          },
        },
      },

      orderBy: {
        [safeSortBy]: sortOrder,
      },
    }),

    prisma.area.count({
      where,
    }),
  ]);

  return {
    data: areas,

    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getSingleArea = async (id: string) => {
  const area = await prisma.area.findUnique({
    where: {
      id,
    },

    include: {
      feeder: {
        include: {
          substation: {
            include: {
              zone: true,
            },
          },
        },
      },
    },
  });

  if (!area) {
    throw new AppError(404, "Area not found");
  }

  return area;
};

const updateArea = async (id: string, payload: IUpdateAreaPayload) => {
  const existingArea = await prisma.area.findUnique({
    where: {
      id,
    },
  });

  if (!existingArea) {
    throw new AppError(404, "Area not found");
  }

  if (payload.code) {
    const duplicateArea = await prisma.area.findFirst({
      where: {
        code: payload.code,

        NOT: {
          id,
        },
      },
    });

    if (duplicateArea) {
      throw new AppError(409, "Area code already exists");
    }
  }

  if (payload.feederId) {
    const feeder = await prisma.feeder.findUnique({
      where: {
        id: payload.feederId,
      },
    });

    if (!feeder) {
      throw new AppError(404, "Feeder not found");
    }

    if (!feeder.isActive) {
      throw new AppError(400, "Cannot move area to an inactive feeder");
    }
  }

  const updatedArea = await prisma.area.update({
    where: {
      id,
    },

    data: payload,
  });

  return updatedArea;
};

const deleteArea = async (id: string) => {
  const existingArea = await prisma.area.findUnique({
    where: {
      id,
    },
  });

  if (!existingArea) {
    throw new AppError(404, "Area not found");
  }

  const deletedArea = await prisma.area.update({
    where: {
      id,
    },

    data: {
      isActive: false,
    },
  });

  return deletedArea;
};

export const AreaService = {
  createArea,
  getAllAreas,
  getSingleArea,
  updateArea,
  deleteArea,
};
