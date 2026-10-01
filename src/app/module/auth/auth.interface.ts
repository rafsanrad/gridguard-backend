import { Role } from "../../../generated/prisma/browser"

export interface IRegisterCustomerPayload {
    name: string
    email: string
    password: string
}

export interface IVerifyEmailOtpPayload {
  email: string;
  otp: string;
}

export interface IForgotPasswordPayload {
  email: string;
}

export interface IResetPasswordPayload {
  email: string;
  otp: string;
  newPassword: string;
}

export interface ILoginUserPayload {
    email: string
    password: string
}

export interface IGoogleLoginPayload {
  idToken: string;
}

export interface IRequestUser {
    userId: string
    email: string
    name: string
    role: Role
}