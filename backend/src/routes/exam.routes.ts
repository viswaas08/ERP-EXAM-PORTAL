import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import { audit } from "../middleware/audit.js";
import * as controller from "../controllers/exam.controller.js";

export const examRoutes = Router();
examRoutes.get("/", authenticate, controller.list);
examRoutes.get("/:id/workflow-phases", authenticate, controller.phases);
examRoutes.post("/", authenticate, authorize("exam:create"), audit("EXAM_CREATE"), controller.create);
examRoutes.post("/:id/clone", authenticate, authorize("exam:create"), audit("EXAM_CLONE"), controller.clone);
examRoutes.patch("/:id/workflow-phases/:phaseId/activate", authenticate, authorize("exam:create"), audit("WORKFLOW_PHASE_ACTIVATE"), controller.activatePhase);
