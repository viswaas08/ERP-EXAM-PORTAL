import type { Request, Response } from "express";
import { examSchema } from "../validators/exam.validator.js";
import * as examService from "../services/exam.service.js";

export async function list(req: Request, res: Response) {
  res.json(await examService.listExams(req.query as any));
}

export async function create(req: Request, res: Response) {
  res.status(201).json(await examService.createExam(examSchema.parse(req.body)));
}

export async function update(req: Request, res: Response) {
  res.json(await examService.updateExam(String(req.params.id), req.body));
}

export async function archive(req: Request, res: Response) {
  res.json(await examService.archiveExam(String(req.params.id)));
}

export async function clone(req: Request, res: Response) {
  res.status(201).json(await examService.cloneExam(String(req.params.id)));
}

export async function phases(req: Request, res: Response) {
  res.json(await examService.listWorkflowPhases(String(req.params.id)));
}

export async function activatePhase(req: Request, res: Response) {
  res.json(await examService.activateWorkflowPhase(String(req.params.id), String(req.params.phaseId)));
}

export async function candidatePhase(req: Request, res: Response) {
  res.json(await examService.getCandidatePhaseSnapshot(req.query.examId as string | undefined));
}
