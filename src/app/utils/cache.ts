
import { redisClient } from "../lib/redis";

export const setCache = async (
  key: string,
  data: unknown,
  ttl = 300,
) => {
  try {
    await redisClient.set(key, JSON.stringify(data), {
      EX: ttl,
    });
  } catch (error) {
    console.error("Redis SET error:", error);
  }
};

export const getCache = async (key: string) => {
  try {
    const data = await redisClient.get(key);

    if (!data) {
      return null;
    }

    return JSON.parse(data);
  } catch (error) {
    console.error("Redis GET error:", error);
    return null;
  }
};

export const deleteCache = async (key: string) => {
  try {
    await redisClient.del(key);
  } catch (error) {
    console.error("Redis DELETE error:", error);
  }
};

export const deleteCacheByPrefix = async (
  prefix: string,
) => {
  try {
    let deletedCount = 0;

    for await (const keys of redisClient.scanIterator({
      MATCH: `${prefix}:*`,
      COUNT: 100,
    })) {
      if (keys.length === 0) {
        continue;
      }

      deletedCount += await redisClient.del(keys);
    }

    console.log(
      `Redis cache invalidated: ${prefix} (${deletedCount} keys deleted)`,
    );
  } catch (error) {
    console.error(
      "Redis cache invalidation error:",
      error,
    );
  }
};
