import { prisma } from "./prisma";
import { redisClient } from "./redis";

let initializationPromise: Promise<void> | null = null;

export const initializeServer = async () => {
  if (!initializationPromise) {
    initializationPromise = (async () => {
      await prisma.$connect();

      if (!redisClient.isOpen) {
        await redisClient.connect();
      }
    })().catch((error) => {
      initializationPromise = null;
      throw error;
    });
  }

  await initializationPromise;
};