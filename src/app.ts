import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application, Request, Response } from "express";
import httpStatus from "http-status";
import config from "./app/config";
import { globalErrorHandler } from "./app/middleware/globalErrorHandler";
import { notFound } from "./app/middleware/notFound";
import { AuthRoutes } from "./app/module/auth/auth.route";
import { ZoneRoutes } from "./app/module/zone/zone.route";
import { SubstationRoutes } from "./app/module/substation/substation.route";
import { FeederRoutes } from "./app/module/feeder/feeder.route";
import { AreaRoutes } from "./app/module/area/area.route";
import { TechnicianRoutes } from "./app/module/technician/technician.route";
import { LoadSheddingRoutes } from "./app/module/loadShedding/loadShedding.route";
import { OutageRoutes } from "./app/module/outage/outage.route";
import { OutageReportRoutes } from "./app/module/outageReport/outageReport.route";
import { TechnicianAssignmentRoutes } from "./app/module/technicianAssignment/technicianAssignment.route";
import { NotificationRoutes } from "./app/module/notification/notification.route";
import { ServiceRequestRoutes } from "./app/module/serviceRequest/serviceRequest.route";
import { PaymentRoutes } from "./app/module/payment/payment.route";

const app: Application = express();

app.use(
  cors({
    origin: config.frontend_url,
    credentials: true,
  }),
);

// Enable URL-encoded form data parsing
app.use(express.urlencoded({ extended: true }));

// Middleware to parse JSON bodies
app.use(express.json());
app.use(cookieParser());

app.use("/api/v1/auth", AuthRoutes);
app.use("/api/v1/zones", ZoneRoutes);
app.use("/api/v1/substations", SubstationRoutes);
app.use("/api/v1/feeders", FeederRoutes);
app.use("/api/v1/areas", AreaRoutes);
app.use("/api/v1/technicians", TechnicianRoutes);
app.use("/api/v1/load-shedding", LoadSheddingRoutes);
app.use("/api/v1/outages", OutageRoutes);
app.use("/api/v1/outage-reports", OutageReportRoutes);
app.use("/api/v1/technician-assignments", TechnicianAssignmentRoutes);
app.use("/api/v1/notifications", NotificationRoutes);
app.use("/api/v1/service-requests", ServiceRequestRoutes);
app.use("/api/v1/payments", PaymentRoutes);

// Basic route
app.get("/", async (req: Request, res: Response) => {
  res.status(httpStatus.OK).json({
    success: true,
    message:
      "Welcome to Loadshedding & Power Outages Management System Backend",
  });
});

app.use(globalErrorHandler);
app.use(notFound);

export default app;
