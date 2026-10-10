import app from "./app";
import config from "./app/config";
import { prisma } from "./app/lib/prisma";
import { redisClient } from "./app/lib/redis";
import { seedInitialUsers } from "./app/utils/seed";

const main = async () => {
  try {
    await prisma.$connect();
    await redisClient.connect();

    if (config.node_env !== "production") {
      await seedInitialUsers();
    }

    app.listen(config.port || 8000, () => {
      console.log(`Server is running on port ${config.port || 8000}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
};

main();