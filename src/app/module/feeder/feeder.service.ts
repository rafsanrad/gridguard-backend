import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
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

const getAllFeeders = async () => {
  const feeders = await prisma.feeder.findMany({
    where: {
      isActive: true,
    },

    include: {
      substation: {
        include: {
          zone: true,
        },
      },
    },

    orderBy: {
      createdAt: "desc",
    },
  });

  return feeders;
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
