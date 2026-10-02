import { prisma } from "../../lib/prisma";

import { ICreateZonePayload, IUpdateZonePayload } from "./zone.interface";

import { AppError } from "../../utils/AppError";

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

  return zone;
};

const getAllZones = async () => {
  const zones = await prisma.zone.findMany({
    where: {
      isActive: true,
    },

    orderBy: {
      createdAt: "desc",
    },
  });

  return zones;
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

  return updatedZone;
};

const deleteZone = async (
  id: string,
) => {

  const existingZone = await prisma.zone.findUnique({
    where: {
      id,
    },
  });

  if (!existingZone) {
    throw new AppError(
      404,
      "Zone not found",
    );
  }

  const deletedZone =
    await prisma.zone.update({
      where: {
        id,
      },
      data: {
        isActive: false,
      },
    });

  return deletedZone;
};

export const ZoneService = {
  createZone,
  getAllZones,
  getSingleZone,
  updateZone,
  deleteZone
};
