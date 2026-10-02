import bcrypt from "bcryptjs";

import { Role } from "../../generated/prisma/enums";
import { prisma } from "../lib/prisma";
import config from "../config";

export const seedAdmin = async () => {
  try {
    const existingAdmin = await prisma.user.findFirst({
      where: {
        role: Role.ADMIN,
        deletedAt: null,
      },
    });

    if (existingAdmin) {
      console.log("Admin already exists.");
      return;
    }

    const name = config.admin_name;
    const email = config.admin_email;
    const password = config.admin_password;

    if (!name || !email || !password) {
      throw new Error(
        "Admin name, email, password missing in env file.",
      );
    }

    const hashedPassword = await bcrypt.hash(
      password,
      Number(config.bcrypt_salt_rounds),
    );

    const admin = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: Role.ADMIN,
        needPasswordChange: false,
        emailVerified: true,
      },
    });

    console.log("Admin created:", admin.email);
  } catch (error) {
    console.log("Error seeding admin:", error);
  }
};

export const seedOperator = async () => {
  try {
    const existingOperator = await prisma.user.findFirst({
      where: {
        role: Role.OPERATOR,
        deletedAt: null,
      },
    });

    if (existingOperator) {
      console.log("Operator already exists.");
      return;
    }

    const name = config.operator_name;
    const email = config.operator_email;
    const password = config.operator_password;

    if (!name || !email || !password) {
      throw new Error(
        "Operator name, email, password missing in env file.",
      );
    }

    const hashedPassword = await bcrypt.hash(
      password,
      Number(config.bcrypt_salt_rounds),
    );

    const operator = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: Role.OPERATOR,
        needPasswordChange: false,
        emailVerified: true,
      },
    });

    console.log("Operator created:", operator.email);
  } catch (error) {
    console.log("Error seeding operator:", error);
  }
};

export const seedInitialUsers = async () => {
  await seedAdmin();
  await seedOperator();
};