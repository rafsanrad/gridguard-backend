import app from "./src/app";
import { prisma } from "./src/app/lib/prisma";
import { redisClient } from "./src/app/lib/redis";
import { seedInitialUsers } from "./src/app/utils/seed";

let initialized: Promise<void> | null = null;

const initialize = async () => {
  await prisma.$connect();

  if (!redisClient.isOpen) {
    await redisClient.connect();
  }

  await seedInitialUsers();
};

const handler = async (req: any, res: any) => {
  try {
    initialized ??= initialize();
    await initialized;
    return app(req, res);
  } catch (error) {
    initialized = null;
    console.error("Server initialization failed:", error);

    return res.status(500).json({
      success: false,
      message: "Server initialization failed",
      errors: [],
    });
  }
};

export default handler;