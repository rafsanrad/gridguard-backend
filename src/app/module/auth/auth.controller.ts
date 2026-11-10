import { Request, Response } from "express";
import httpStatus from "http-status";

import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { AppError } from "../../utils/AppError";

import { IRequestUser } from "./auth.interface";
import { AuthService } from "./auth.service";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: (process.env.NODE_ENV === "production" ? "none" : "lax") as
    | "none"
    | "lax",
};

const registerCustomer = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;

  const result = await AuthService.registerCustomer(payload);

  const { accessToken, refreshToken, user } = result;

  res.cookie("accessToken", accessToken, {
    ...cookieOptions,
    maxAge: 1000 * 60 * 60 * 24,
  });

  res.cookie("refreshToken", refreshToken, {
    ...cookieOptions,
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

const verifyEmail = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;

  const result = await AuthService.verifyEmail(email);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Verification OTP sent successfully",
    data: result,
  });
});

const verifyEmailOtp = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.verifyEmailOtp(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Email verified successfully",
    data: result,
  });
});

const loginUser = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;

  const result = await AuthService.loginUser(payload);

  const { accessToken, refreshToken } = result;

  res.cookie("accessToken", accessToken, {
    ...cookieOptions,
    maxAge: 1000 * 60 * 60 * 24,
  });

  res.cookie("refreshToken", refreshToken, {
    ...cookieOptions,
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

const googleLogin = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.googleLogin(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Google login successful",
    data: result,
  });
});

const googleAuth = catchAsync(async (_req: Request, res: Response) => {
  const authUrl = AuthService.getGoogleAuthUrl();

  res.redirect(authUrl);
});

const googleCallback = catchAsync(async (req: Request, res: Response) => {
  const code = req.query.code as string;

  if (!code) {
    throw new AppError(400, "Google authorization code is missing.");
  }

  const result = await AuthService.googleCallback(code);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Google login successful",
    data: result,
  });
});

const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.forgotPassword(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Password reset OTP sent successfully",
    data: result,
  });
});

const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.resetPassword(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Password reset successfully",
    data: result,
  });
});

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

  const { accessToken, refreshToken: newRefreshToken } = result;

  res.cookie("accessToken", accessToken, {
    ...cookieOptions,
    maxAge: 1000 * 60 * 60 * 24,
  });

  res.cookie("refreshToken", newRefreshToken, {
    ...cookieOptions,
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

const logoutUser = catchAsync(async (req: Request, res: Response) => {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: (process.env.NODE_ENV === "production"
      ? "none"
      : "lax") as "none" | "lax",
  };

  res.clearCookie("accessToken", cookieOptions);
  res.clearCookie("refreshToken", cookieOptions);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Logged out successfully",
    data: null,
  });
});

export const AuthController = {
  registerCustomer,
  verifyEmail,
  verifyEmailOtp,
  loginUser,
  logoutUser,
  googleLogin,
  googleAuth,
  googleCallback,
  forgotPassword,
  resetPassword,
  getMe,
  refreshToken,
};
