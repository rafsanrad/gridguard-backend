import httpStatus from "http-status";

import config from "../config";
import { redisClient } from "./redis";
import { AppError } from "../utils/AppError";

export const getBkashIdToken = async () => {
  const idTokenKey = "bkash:idToken";
  const refreshTokenKey = "bkash:refreshToken";

  try {
    const bkashIdToken = await redisClient.get(idTokenKey);

    const bkashIdTokenTTL = await redisClient.ttl(idTokenKey);

    const bkashRefreshToken = await redisClient.get(refreshTokenKey);

    const bkashRefreshTokenTTL = await redisClient.ttl(refreshTokenKey);

    // Use existing ID token if it has more than 10 minutes remaining.
    if (bkashIdToken && bkashIdTokenTTL > 600) {
      return bkashIdToken;
    }

    // Refresh the ID token if:
    // 1. ID token is missing/near expiry
    // 2. Refresh token exists
    // 3. Refresh token has more than 10 minutes remaining
    if (
      (!bkashIdToken || bkashIdTokenTTL <= 600) &&
      bkashRefreshToken &&
      bkashRefreshTokenTTL > 600
    ) {
      const refreshTokenResponse = await fetch(
        `${config.bkash_base_url}/tokenized/checkout/token/refresh`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            username: config.bkash_username,
            password: config.bkash_password,
          },
          body: JSON.stringify({
            app_key: config.bkash_app_key,
            app_secret: config.bkash_app_secret,
            refresh_token: bkashRefreshToken,
          }),
        },
      );

      if (!refreshTokenResponse.ok) {
        throw new AppError(
          httpStatus.BAD_GATEWAY,
          "bKash access token refresh failed",
        );
      }

      const result = await refreshTokenResponse.json();

      if (!result.id_token) {
        throw new AppError(
          httpStatus.BAD_GATEWAY,
          "bKash did not return an ID token",
        );
      }

      await redisClient.set(idTokenKey, result.id_token, {
        expiration: {
          type: "EX",
          value: 60 * 60,
        },
      });

      return result.id_token;
    }

    // Generate new ID token and refresh token.
    const response = await fetch(
      `${config.bkash_base_url}/tokenized/checkout/token/grant`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          username: config.bkash_username,
          password: config.bkash_password,
        },
        body: JSON.stringify({
          app_key: config.bkash_app_key,
          app_secret: config.bkash_app_secret,
        }),
      },
    );

    if (!response.ok) {
      throw new AppError(
        httpStatus.BAD_GATEWAY,
        "bKash access token grant failed",
      );
    }

    const result = await response.json();

    if (!result.id_token || !result.refresh_token) {
      throw new AppError(
        httpStatus.BAD_GATEWAY,
        "Invalid bKash token response",
      );
    }

    // Store ID token for 1 hour.
    await redisClient.set(idTokenKey, result.id_token, {
      expiration: {
        type: "EX",
        value: 60 * 60,
      },
    });

    // Store refresh token for 28 days.
    await redisClient.set(refreshTokenKey, result.refresh_token, {
      expiration: {
        type: "EX",
        value: 60 * 60 * 24 * 28,
      },
    });

    return result.id_token;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      httpStatus.BAD_GATEWAY,
      "Unable to communicate with bKash",
    );
  }
};
