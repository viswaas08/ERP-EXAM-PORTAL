import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import { audit } from "../middleware/audit.js";
import * as controller from "../controllers/exam.controller.js";

export const examRoutes = Router();
examRoutes.get("/", authenticate, controller.list);
examRoutes.post("/", authenticate, authorize("exam:create"), audit("EXAM_CREATE"), controller.create);
examRoutes.post("/:id/clone", authenticate, authorize("exam:create"), audit("EXAM_CLONE"), controller.clone);
