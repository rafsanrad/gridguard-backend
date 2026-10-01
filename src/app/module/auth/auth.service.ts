import bcrypt from "bcryptjs";
import { JwtPayload, SignOptions } from "jsonwebtoken";

import { Role, UserStatus } from "../../../generated/prisma/enums";

import crypto from "crypto";
import path from "path";
import ejs from "ejs";

import config from "../../config";
import { prisma } from "../../lib/prisma";
import { jwtUtils } from "../../utils/jwt";
import { AppError } from "../../utils/AppError";

import {
  IForgotPasswordPayload,
  IGoogleLoginPayload,
  ILoginUserPayload,
  IRegisterCustomerPayload,
  IRequestUser,
  IResetPasswordPayload,
  IVerifyEmailOtpPayload,
} from "./auth.interface";
import { redisClient } from "../../lib/redis";
import { transporter } from "../../lib/nodemailer";
import { OAuth2Client } from "google-auth-library";

const googleClient = new OAuth2Client(config.google_client_id);

const googleOAuthClient = new OAuth2Client(
  config.google_client_id,
  config.google_client_secret,
  config.google_redirect_uri,
);

const registerCustomer = async (payload: IRegisterCustomerPayload) => {
  const { name, password } = payload;
  const email = payload.email.trim().toLowerCase();

  const isUserExists = await prisma.user.findUnique({
    where: { email },
  });

  if (isUserExists) {
    throw new AppError(409, "User with this email already exists");
  }

  const hashedPassword = await bcrypt.hash(
    password,
    Number(config.bcrypt_salt_rounds) || 10,
  );

  const createdUser = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: Role.CUSTOMER,
      status: UserStatus.ACTIVE,
      emailVerified: false,
    },
    omit: {
      password: true,
    },
  });

  const jwtPayload = {
    userId: createdUser.id,
    name: createdUser.name,
    email: createdUser.email,
    role: createdUser.role,
  };

  const accessToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_access_secret,
    config.jwt_access_expires_in as SignOptions,
  );

  const refreshToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_refresh_secret,
    config.jwt_refresh_expires_in as SignOptions,
  );

  return {
    user: createdUser,
    accessToken,
    refreshToken,
  };
};

const verifyEmail = async (email: string) => {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: {
      email: normalizedEmail,
    },
  });

  if (!user) {
    throw new AppError(404, "User does not exist.");
  }

  if (user.status === UserStatus.BLOCKED) {
    throw new AppError(403, "User is blocked.");
  }

  if (user.deletedAt || user.status === UserStatus.DELETED) {
    throw new AppError(403, "User is deleted.");
  }

  if (user.emailVerified) {
    throw new AppError(400, "Email is already verified.");
  }

  const otp = crypto.randomInt(100000, 1000000).toString();

  const key = `gridguard:email-verification:otp:${user.email}`;

  const expirationSeconds = 5 * 60;

  await redisClient.set(key, otp, {
    EX: expirationSeconds,
  });

  const templatePath = path.join(
    process.cwd(),
    "src/app/templates/verify-email.ejs",
  );

  const templateData = {
    name: user.name,
    otp,
    expirationMinutes: expirationSeconds / 60,
  };

  const html = await ejs.renderFile(templatePath, templateData);

  await transporter.sendMail({
    from: config.email_sender,
    to: user.email,
    subject: "GridGuard - Email Verification OTP",
    html,
  });

  return {
    email: user.email,
    message: "Verification OTP sent to your email.",
  };
};

const verifyEmailOtp = async (payload: IVerifyEmailOtpPayload) => {
  const email = payload.email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    throw new AppError(404, "User does not exist.");
  }

  if (user.status === UserStatus.BLOCKED) {
    throw new AppError(403, "User is blocked.");
  }

  if (user.deletedAt || user.status === UserStatus.DELETED) {
    throw new AppError(403, "User is deleted.");
  }

  if (user.emailVerified) {
    throw new AppError(400, "Email is already verified.");
  }

  const key = `gridguard:email-verification:otp:${user.email}`;

  const storedOtp = await redisClient.get(key);

  if (!storedOtp) {
    throw new AppError(400, "OTP has expired or does not exist.");
  }

  if (storedOtp !== payload.otp) {
    throw new AppError(400, "Invalid OTP.");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
    },
  });

  const templatePath = path.join(
    process.cwd(),
    "src/app/templates/welcome.ejs",
  );

  const html = await ejs.renderFile(templatePath, {
    name: user.name,
  });

  const emailResult = await transporter.sendMail({
    from: config.email_sender,
    to: user.email,
    subject: "Welcome to GridGuard!",
    html,
  });

  await redisClient.del(key);

  return {
    email: user.email,
    emailVerified: true,
  };
};

const loginUser = async (payload: ILoginUserPayload) => {
  const { password } = payload;
  const email = payload.email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new AppError(401, "Invalid credentials");
  }

  if (user.status === UserStatus.BLOCKED) {
    throw new AppError(403, "User is blocked");
  }

  if (user.deletedAt || user.status === UserStatus.DELETED) {
    throw new AppError(403, "User is deleted");
  }

  if (!user.password) {
    throw new AppError(
      400,
      "This account does not have a password. Please use Google login.",
    );
  }

  const isPasswordMatched = await bcrypt.compare(password, user.password);

  if (!isPasswordMatched) {
    throw new AppError(401, "Invalid credentials");
  }

  const jwtPayload = {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_access_secret,
    config.jwt_access_expires_in as SignOptions,
  );

  const refreshToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_refresh_secret,
    config.jwt_refresh_expires_in as SignOptions,
  );

  return {
    accessToken,
    refreshToken,
  };
};

const googleLogin = async (payload: IGoogleLoginPayload) => {
  const ticket = await googleClient.verifyIdToken({
    idToken: payload.idToken,
    audience: config.google_client_id,
  });

  const googlePayload = ticket.getPayload();

  if (!googlePayload || !googlePayload.email || !googlePayload.sub) {
    throw new AppError(401, "Invalid Google account information.");
  }

  const email = googlePayload.email.trim().toLowerCase();

  const googleId = googlePayload.sub;

  let user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (user) {
    if (user.status === UserStatus.BLOCKED) {
      throw new AppError(403, "User is blocked.");
    }

    if (user.deletedAt || user.status === UserStatus.DELETED) {
      throw new AppError(403, "User is deleted.");
    }

    if (!user.googleId) {
      user = await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          googleId,
          emailVerified: true,
        },
      });
    }
  } else {
    user = await prisma.user.create({
      data: {
        name: googlePayload.name || "Google User",
        email,
        googleId,
        profilePhoto: googlePayload.picture,
        emailVerified: true,
        role: Role.CUSTOMER,
        status: UserStatus.ACTIVE,
      },
    });
  }

  const jwtPayload = {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_access_secret,
    config.jwt_access_expires_in as SignOptions,
  );

  const refreshToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_refresh_secret,
    config.jwt_refresh_expires_in as SignOptions,
  );

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      profilePhoto: user.profilePhoto,
      role: user.role,
      emailVerified: user.emailVerified,
    },
    accessToken,
    refreshToken,
  };
};

const getGoogleAuthUrl = () => {
  const authUrl = googleOAuthClient.generateAuthUrl({
    access_type: "offline",
    scope: ["openid", "email", "profile"],
    prompt: "select_account",
  });

  return authUrl;
};

const googleCallback = async (code: string) => {
  const { tokens } = await googleOAuthClient.getToken(code);

  if (!tokens.id_token) {
    throw new AppError(401, "Google ID token was not received.");
  }

  return googleLogin({
    idToken: tokens.id_token,
  });
};

const forgotPassword = async (payload: IForgotPasswordPayload) => {
  const email = payload.email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    throw new AppError(404, "User does not exist.");
  }

  if (user.status === UserStatus.BLOCKED) {
    throw new AppError(403, "User is blocked.");
  }

  if (user.deletedAt || user.status === UserStatus.DELETED) {
    throw new AppError(403, "User is deleted.");
  }

  if (!user.emailVerified) {
    throw new AppError(403, "Please verify your email first.");
  }

  if (user.googleId && !user.password) {
    throw new AppError(400, "This account uses Google login.");
  }

  const otp = crypto.randomInt(100000, 1000000).toString();

  const key = `gridguard:forgot-password:otp:${user.email}`;

  const expirationSeconds = 5 * 60;

  await redisClient.set(key, otp, {
    EX: expirationSeconds,
  });

  const templatePath = path.join(
    process.cwd(),
    "src/app/templates/forgot-password.ejs",
  );

  const templateData = {
    name: user.name,
    otp,
    expirationMinutes: expirationSeconds / 60,
  };

  const html = await ejs.renderFile(templatePath, templateData);

  await transporter.sendMail({
    from: config.email_sender,
    to: user.email,
    subject: "GridGuard - Password Reset OTP",
    html,
  });

  return {
    email: user.email,
    message: "Password reset OTP sent to your email.",
  };
};

const resetPassword = async (payload: IResetPasswordPayload) => {
  const email = payload.email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    throw new AppError(404, "User does not exist.");
  }

  if (user.status === UserStatus.BLOCKED) {
    throw new AppError(403, "User is blocked.");
  }

  if (user.deletedAt || user.status === UserStatus.DELETED) {
    throw new AppError(403, "User is deleted.");
  }

  if (!user.emailVerified) {
    throw new AppError(403, "Please verify your email first.");
  }

  const key = `gridguard:forgot-password:otp:${user.email}`;

  const storedOtp = await redisClient.get(key);

  if (!storedOtp) {
    throw new AppError(400, "OTP has expired or does not exist.");
  }

  if (storedOtp !== payload.otp) {
    throw new AppError(400, "Invalid OTP.");
  }

  const hashedPassword = await bcrypt.hash(
    payload.newPassword,
    Number(config.bcrypt_salt_rounds) || 10,
  );

  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      password: hashedPassword,
      needPasswordChange: false,
    },
  });

  await redisClient.del(key);

  return {
    email: user.email,
    message: "Password reset successfully.",
  };
};

const getMe = async (user: IRequestUser) => {
  const existingUser = await prisma.user.findUnique({
    where: {
      id: user.userId,
    },
    omit: {
      password: true,
    },
  });

  if (!existingUser) {
    throw new AppError(404, "User not found");
  }

  if (existingUser.status === UserStatus.BLOCKED) {
    throw new AppError(403, "User is blocked");
  }

  if (existingUser.deletedAt || existingUser.status === UserStatus.DELETED) {
    throw new AppError(403, "User is deleted");
  }

  return existingUser;
};

const refreshToken = async (token: string) => {
  const verifiedRefreshToken = jwtUtils.verifyToken(
    token,
    config.jwt_refresh_secret,
  );

  if (!verifiedRefreshToken.success || !verifiedRefreshToken.data) {
    throw new AppError(401, "Invalid refresh token");
  }

  const data = verifiedRefreshToken.data as JwtPayload;

  const user = await prisma.user.findUnique({
    where: {
      id: data.userId,
    },
  });

  if (!user || user.deletedAt || user.status !== UserStatus.ACTIVE) {
    throw new AppError(401, "User is inactive or not found");
  }

  const jwtPayload = {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_access_secret,
    config.jwt_access_expires_in as SignOptions,
  );

  const refreshToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_refresh_secret,
    config.jwt_refresh_expires_in as SignOptions,
  );

  return {
    accessToken,
    refreshToken,
  };
};

export const AuthService = {
  registerCustomer,
  verifyEmail,
  verifyEmailOtp,
  loginUser,
  googleLogin,
  getGoogleAuthUrl,
  googleCallback,
  forgotPassword,
  resetPassword,
  getMe,
  refreshToken,
};
