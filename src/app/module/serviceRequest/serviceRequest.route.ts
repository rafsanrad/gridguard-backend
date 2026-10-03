import { Router } from "express";

import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";

import { ServiceRequestController } from "./serviceRequest.controller";
import { ServiceRequestValidation } from "./serviceRequest.validation";
import { validateQuery } from "../../middleware/validateQuery";

const router = Router();

router.post(
  "/",
  auth(Role.CUSTOMER),
  validateRequest(ServiceRequestValidation.createServiceRequestSchema),
  ServiceRequestController.createServiceRequest,
);

router.get(
  "/",
  auth(Role.ADMIN, Role.OPERATOR),
  validateQuery,
  ServiceRequestController.getAllServiceRequests,
);

router.get(
  "/:id",
  auth(Role.ADMIN, Role.OPERATOR, Role.CUSTOMER),
  ServiceRequestController.getSingleServiceRequest,
);

router.patch(
  "/:id",
  auth(Role.ADMIN, Role.OPERATOR),
  validateRequest(ServiceRequestValidation.updateServiceRequestSchema),
  ServiceRequestController.updateServiceRequest,
);

export const ServiceRequestRoutes = router;
