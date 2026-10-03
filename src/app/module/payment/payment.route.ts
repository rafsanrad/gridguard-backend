import { Router } from "express";
import { validateRequest } from "../../middleware/validateRequest";
import { PaymentController } from "./payment.controller";
import { PaymentValidation } from "./payment.validation";
import { auth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";
import { validateQuery } from "../../middleware/validateQuery";

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
  validateQuery,
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
