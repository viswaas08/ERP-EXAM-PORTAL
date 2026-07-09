import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import * as controller from "../controllers/dashboard.controller.js";

export const dashboardRoutes = Router();
dashboardRoutes.get("/summary", authenticate, controller.summary);
