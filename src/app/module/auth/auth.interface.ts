import { Role } from "../../../generated/prisma/browser"

export interface ILoginUserPayload {
    email: string
    password: string
}

export interface IRegisterCustomerPayload {
    name: string
    email: string
    password: string
}

export interface IVerifyEmailOtpPayload {
  email: string;
  otp: string;
}

export interface IRequestUser {
    userId: string
    email: string
    name: string
    role: Role
}