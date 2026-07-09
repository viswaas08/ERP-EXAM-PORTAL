import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import * as controller from "../controllers/rule.controller.js";

export const ruleRoutes = Router();
ruleRoutes.get("/", authenticate, controller.list);
ruleRoutes.post("/:examId/simulate", authenticate, authorize("rule:execute"), controller.simulate);
