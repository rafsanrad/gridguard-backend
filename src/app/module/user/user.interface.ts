import { Role, UserStatus } from "../../../generated/prisma/enums";

export interface IUpdateUserStatusPayload {
  status: UserStatus;
}

export interface IUpdateUserPayload {
  name?: string;
  phone?: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  role?: Role;
}