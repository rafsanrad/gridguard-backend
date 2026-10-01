import { Request, Response } from "express";
import httpStatus from "http-status";

import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { AppError } from "../../utils/AppError";

import { IRequestUser } from "./auth.interface";
import { AuthService } from "./auth.service";

const registerCustomer = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;

  const result = await AuthService.registerCustomer(payload);

  const { accessToken, refreshToken, user } = result;

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 * 24,
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Customer registered successfully",
    data: {
      user,
      accessToken,
      refreshToken,
    },
  });
});

const verifyEmail = catchAsync(
  async (req: Request, res: Response) => {
    const { email } = req.body;

    const result = await AuthService.verifyEmail(email);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Verification OTP sent successfully",
      data: result,
    });
  },
);

const verifyEmailOtp = catchAsync(
  async (req: Request, res: Response) => {
    const result = await AuthService.verifyEmailOtp(
      req.body,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Email verified successfully",
      data: result,
    });
  },
);

const loginUser = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;

  const result = await AuthService.loginUser(payload);

  const { accessToken, refreshToken } = result;

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 * 24,
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User logged in successfully",
    data: {
      accessToken,
      refreshToken,
    },
  });
});

const forgotPassword = catchAsync(
  async (req: Request, res: Response) => {
    const result = await AuthService.forgotPassword(
      req.body,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Password reset OTP sent successfully",
      data: result,
    });
  },
);

const resetPassword = catchAsync(
  async (req: Request, res: Response) => {
    const result = await AuthService.resetPassword(
      req.body,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Password reset successfully",
      data: result,
    });
  },
);

const getMe = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IRequestUser;

  if (!user) {
    throw new AppError(401, "User information is missing");
  }

  const result = await AuthService.getMe(user);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User profile fetched successfully",
    data: result,
  });
});

const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const token = req.cookies.refreshToken;

  if (!token) {
    throw new AppError(401, "Refresh token is missing");
  }

  const result = await AuthService.refreshToken(token);

  const {
    accessToken,
    refreshToken: newRefreshToken,
  } = result;

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 * 24,
  });

  res.cookie("refreshToken", newRefreshToken, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "New tokens generated successfully",
    data: {
      accessToken,
      refreshToken: newRefreshToken,
    },
  });
});

export const AuthController = {
  registerCustomer,
  verifyEmail,
  verifyEmailOtp,
  loginUser,
  forgotPassword,
  resetPassword,
  getMe,
  refreshToken,
};