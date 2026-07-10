import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import { audit } from "../middleware/audit.js";
import * as controller from "../controllers/application.controller.js";

export const applicationRoutes = Router();
applicationRoutes.get("/", authenticate, controller.list);
applicationRoutes.patch("/:id/status", authenticate, authorize("application:review", "verifier:document:review", "controller:exam:manage"), audit("APPLICATION_STATUS"), controller.updateStatus);
applicationRoutes.get("/:id/acknowledgement.pdf", authenticate, controller.acknowledgement);
