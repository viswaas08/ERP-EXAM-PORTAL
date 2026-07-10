import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import * as controller from "../controllers/rule.controller.js";

export const ruleRoutes = Router();
ruleRoutes.get("/", authenticate, controller.list);
ruleRoutes.post("/save", authenticate, authorize("settings:update"), controller.save);
ruleRoutes.post("/:examId/simulate", authenticate, authorize("rule:execute"), controller.simulate);
ruleRoutes.post("/:examId/execute", authenticate, authorize("rule:execute"), controller.execute);
