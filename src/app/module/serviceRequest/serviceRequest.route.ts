import { Router } from "express";
import { validateRequest } from "../../middleware/validateRequest";
import { ServiceRequestController } from "./serviceRequest.controller";
import { ServiceRequestValidation } from "./serviceRequest.validation";

const router = Router();

router.post(
  "/",
  validateRequest(ServiceRequestValidation.createServiceRequestSchema),
  ServiceRequestController.createServiceRequest,
);

router.get("/", ServiceRequestController.getAllServiceRequests);

router.get("/:id", ServiceRequestController.getSingleServiceRequest);

router.patch(
  "/:id",
  validateRequest(ServiceRequestValidation.updateServiceRequestSchema),
  ServiceRequestController.updateServiceRequest,
);

export const ServiceRequestRoutes = router;
