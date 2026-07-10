import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import { audit } from "../middleware/audit.js";
import * as controller from "../controllers/exam.controller.js";

export const examRoutes = Router();
examRoutes.get("/", authenticate, controller.list);
examRoutes.get("/live", authenticate, controller.live);
examRoutes.get("/:id/workflow-phases", authenticate, controller.phases);
examRoutes.post("/", authenticate, authorize("exam:create", "controller:exam:manage"), audit("EXAM_CREATE"), controller.create);
examRoutes.patch("/:id", authenticate, authorize("exam:create", "controller:exam:manage"), audit("EXAM_UPDATE"), controller.update);
examRoutes.delete("/:id", authenticate, authorize("exam:create", "controller:exam:manage"), audit("EXAM_ARCHIVE"), controller.archive);
examRoutes.post("/:id/clone", authenticate, authorize("exam:create", "controller:exam:manage"), audit("EXAM_CLONE"), controller.clone);
examRoutes.patch("/:id/workflow-phases/:phaseId/activate", authenticate, authorize("exam:create", "controller:exam:manage"), audit("WORKFLOW_PHASE_ACTIVATE"), controller.activatePhase);
