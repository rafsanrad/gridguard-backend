import { prisma } from "../../lib/prisma";

import { ICreateZonePayload, IUpdateZonePayload } from "./zone.interface";

import { AppError } from "../../utils/AppError";
import { IQueryParams } from "../../interfaces/common";
import { getSafeSortField } from "../../utils/query";
import { deleteCacheByPrefix, getCache, setCache } from "../../utils/cache";

const createZone = async (payload: ICreateZonePayload) => {
  const existingZone = await prisma.zone.findUnique({
    where: {
      code: payload.code,
    },
  });

  if (existingZone) {
    throw new AppError(409, "Zone code already exists");
  }

  const zone = await prisma.zone.create({
    data: {
      name: payload.name,
      code: payload.code,
      description: payload.description,
    },
  });

  await deleteCacheByPrefix("zones");

  return zone;
};

const getAllZones = async (query?: IQueryParams) => {
  const page = query?.page ?? 1;
  const limit = query?.limit ?? 10;
  const search = query?.search ?? "";
  const sortBy = query?.sortBy ?? "createdAt";
  const sortOrder = query?.sortOrder ?? "desc";

  const cacheKey = `zones:${page}:${limit}:${search}:${sortBy}:${sortOrder}`;

  const cachedData = await getCache(cacheKey);

  if (cachedData) {
    return cachedData;
  }

  const skip = (page - 1) * limit;

  const safeSortBy = getSafeSortField(
    sortBy,
    ["name", "code", "createdAt", "updatedAt"],
    "createdAt",
  );

  const where = {
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
              description: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
          ],
        }
      : {}),
  };

  const [zones, total] = await prisma.$transaction([
    prisma.zone.findMany({
      where,
      skip,
      take: limit,

      orderBy: {
        [safeSortBy]: sortOrder,
      },
    }),

    prisma.zone.count({
      where,
    }),
  ]);

  const result = {
    data: zones,

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

const getSingleZone = async (id: string) => {
  const zone = await prisma.zone.findUnique({
    where: {
      id,
    },
  });

  if (!zone) {
    throw new AppError(404, "Zone not found");
  }

  return zone;
};

const updateZone = async (id: string, payload: IUpdateZonePayload) => {
  const existingZone = await prisma.zone.findUnique({
    where: {
      id,
    },
  });

  if (!existingZone) {
    throw new AppError(404, "Zone not found");
  }

  if (payload.code) {
    const duplicateZone = await prisma.zone.findFirst({
      where: {
        code: payload.code,

        NOT: {
          id,
        },
      },
    });

    if (duplicateZone) {
      throw new AppError(409, "Zone code already exists");
    }
  }

  const updatedZone = await prisma.zone.update({
    where: {
      id,
    },

    data: payload,
  });

  await deleteCacheByPrefix("zones");

  return updatedZone;
};

const deleteZone = async (id: string) => {
  const existingZone = await prisma.zone.findUnique({
    where: {
      id,
    },
  });

  if (!existingZone) {
    throw new AppError(404, "Zone not found");
  }

  const deletedZone = await prisma.zone.update({
    where: {
      id,
    },

    data: {
      isActive: false,
    },
  });

  await deleteCacheByPrefix("zones");

  return deletedZone;
};

export const ZoneService = {
  createZone,
  getAllZones,
  getSingleZone,
  updateZone,
  deleteZone,
};
