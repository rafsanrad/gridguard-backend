import { IQueryParams } from "../../interfaces/common";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { getSafeSortField } from "../../utils/query";
import { ICreateFeederPayload, IUpdateFeederPayload } from "./feeder.interface";

const createFeeder = async (payload: ICreateFeederPayload) => {
  const substation = await prisma.substation.findUnique({
    where: {
      id: payload.substationId,
    },
  });

  if (!substation) {
    throw new AppError(404, "Substation not found");
  }

  if (!substation.isActive) {
    throw new AppError(
      400,
      "Cannot create feeder under an inactive substation",
    );
  }

  const existingFeeder = await prisma.feeder.findUnique({
    where: {
      code: payload.code,
    },
  });

  if (existingFeeder) {
    throw new AppError(409, "Feeder code already exists");
  }

  const feeder = await prisma.feeder.create({
    data: {
      name: payload.name,
      code: payload.code,
      voltageLevel: payload.voltageLevel,
      substationId: payload.substationId,
    },
  });

  return feeder;
};

const getAllFeeders = async (query?: IQueryParams) => {
  const page = query?.page ?? 1;
  const limit = query?.limit ?? 10;
  const skip = (page - 1) * limit;

  const search = query?.search;
  const sortBy = query?.sortBy;
  const sortOrder = query?.sortOrder ?? "desc";

  const safeSortBy = getSafeSortField(
    sortBy,
    ["name", "code", "voltageLevel", "createdAt", "updatedAt"],
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
              voltageLevel: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
          ],
        }
      : {}),
  };

  const [feeders, total] = await prisma.$transaction([
    prisma.feeder.findMany({
      where,
      skip,
      take: limit,

      include: {
        substation: {
          include: {
            zone: true,
          },
        },
      },

      orderBy: {
        [safeSortBy]: sortOrder,
      },
    }),

    prisma.feeder.count({
      where,
    }),
  ]);

  return {
    data: feeders,

    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getSingleFeeder = async (id: string) => {
  const feeder = await prisma.feeder.findUnique({
    where: {
      id,
    },

    include: {
      substation: {
        include: {
          zone: true,
        },
      },
    },
  });

  if (!feeder) {
    throw new AppError(404, "Feeder not found");
  }

  return feeder;
};

const updateFeeder = async (id: string, payload: IUpdateFeederPayload) => {
  const existingFeeder = await prisma.feeder.findUnique({
    where: {
      id,
    },
  });

  if (!existingFeeder) {
    throw new AppError(404, "Feeder not found");
  }

  if (payload.code) {
    const duplicateFeeder = await prisma.feeder.findFirst({
      where: {
        code: payload.code,

        NOT: {
          id,
        },
      },
    });

    if (duplicateFeeder) {
      throw new AppError(409, "Feeder code already exists");
    }
  }

  if (payload.substationId) {
    const substation = await prisma.substation.findUnique({
      where: {
        id: payload.substationId,
      },
    });

    if (!substation) {
      throw new AppError(404, "Substation not found");
    }

    if (!substation.isActive) {
      throw new AppError(400, "Cannot move feeder to an inactive substation");
    }
  }

  const updatedFeeder = await prisma.feeder.update({
    where: {
      id,
    },

    data: payload,
  });

  return updatedFeeder;
};

const deleteFeeder = async (id: string) => {
  const existingFeeder = await prisma.feeder.findUnique({
    where: {
      id,
    },
  });

  if (!existingFeeder) {
    throw new AppError(404, "Feeder not found");
  }

  const deletedFeeder = await prisma.feeder.update({
    where: {
      id,
    },

    data: {
      isActive: false,
    },
  });

  return deletedFeeder;
};

export const FeederService = {
  createFeeder,
  getAllFeeders,
  getSingleFeeder,
  updateFeeder,
  deleteFeeder,
};
