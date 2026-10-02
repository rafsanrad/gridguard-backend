import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { ICreateTechnicianAssignmentPayload } from "./technicianAssignment.interface";

const createTechnicianAssignment = async (
  payload: ICreateTechnicianAssignmentPayload,
  assignedById: string,
) => {
  const outage = await prisma.outage.findUnique({
    where: {
      id: payload.outageId,
    },
  });

  if (!outage) {
    throw new AppError(404, "Outage not found");
  }

  if (outage.status === "RESTORED" || outage.status === "CLOSED") {
    throw new AppError(
      400,
      "Cannot assign technician to a restored or closed outage",
    );
  }

  const technician = await prisma.technician.findUnique({
    where: {
      id: payload.technicianId,
    },
  });

  if (!technician) {
    throw new AppError(404, "Technician not found");
  }

  if (!technician.isActive) {
    throw new AppError(400, "Technician is inactive");
  }

  if (technician.status !== "AVAILABLE") {
    throw new AppError(400, "Technician is not available");
  }

  const assignedBy = await prisma.user.findUnique({
    where: {
      id: assignedById,
    },
  });

  if (!assignedBy) {
    throw new AppError(404, "Assigning user not found");
  }

  const result = await prisma.$transaction(async (tx) => {
    const assignment = await tx.technicianAssignment.create({
      data: {
        outageId: payload.outageId,
        technicianId: payload.technicianId,
        assignedById: assignedById,
        notes: payload.notes,
      },
    });

    await tx.technician.update({
      where: {
        id: payload.technicianId,
      },
      data: {
        status: "ASSIGNED",
      },
    });

    await tx.outage.update({
      where: {
        id: payload.outageId,
      },
      data: {
        status: "ASSIGNED",
      },
    });

    await tx.auditLog.create({
      data: {
        action: "ASSIGN",
        entity: "TechnicianAssignment",
        entityId: assignment.id,

        oldValues: {
          technicianStatus: "AVAILABLE",
          outageStatus: outage.status,
        },

        newValues: {
          technicianStatus: "ASSIGNED",
          outageStatus: "ASSIGNED",
          technicianId: technician.id,
          outageId: outage.id,
        },

        actorId: assignedById,
      },
    });

    return assignment;
  });

  return result;
};

const getAllTechnicianAssignments = async () => {
  const assignments = await prisma.technicianAssignment.findMany({
    include: {
      outage: true,
      technician: true,
      assignedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return assignments;
};

const getSingleTechnicianAssignment = async (id: string) => {
  const assignment = await prisma.technicianAssignment.findUnique({
    where: {
      id,
    },
    include: {
      outage: true,
      technician: true,
      assignedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!assignment) {
    throw new AppError(404, "Technician assignment not found");
  }

  return assignment;
};

export const TechnicianAssignmentService = {
  createTechnicianAssignment,
  getAllTechnicianAssignments,
  getSingleTechnicianAssignment,
};
