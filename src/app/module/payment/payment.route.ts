import { Router } from "express";
import { validateRequest } from "../../middleware/validateRequest";
import { PaymentController } from "./payment.controller";
import { PaymentValidation } from "./payment.validation";

const router = Router();

router.post(
  "/create",
  validateRequest(PaymentValidation.createPaymentSchema),
  PaymentController.createPayment,
);

router.post(
  "/execute",
  PaymentController.executePayment,
);

router.get(
  "/bkash/callback",
  PaymentController.bkashCallback,
);

export const PaymentRoutes = router;
