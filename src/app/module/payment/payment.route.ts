import { Router } from "express";
import { validateRequest } from "../../middleware/validateRequest";
import { PaymentController } from "./payment.controller";
import { PaymentValidation } from "./payment.validation";
import { auth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";

const router = Router();

router.post(
  "/create",
  auth(Role.CUSTOMER),
  validateRequest(
    PaymentValidation.createPaymentSchema,
  ),
  PaymentController.createPayment,
);

router.post(
  "/execute",
  PaymentController.executePayment,
);

router.get(
  "/",
  auth(Role.ADMIN, Role.OPERATOR),
  PaymentController.getAllPayments,
);

router.get(
  "/:id",
  auth(Role.ADMIN, Role.OPERATOR, Role.CUSTOMER),
  PaymentController.getSinglePayment,
);

router.get(
  "/bkash/callback",
  PaymentController.bkashCallback,
);

export const PaymentRoutes = router;
