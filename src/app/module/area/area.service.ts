import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
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

const getAllAreas = async () => {
  const areas = await prisma.area.findMany({
    where: {
      isActive: true,
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

    orderBy: {
      createdAt: "desc",
    },
  });

  return areas;
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
