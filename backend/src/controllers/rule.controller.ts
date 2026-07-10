import type { Request, Response, NextFunction } from "express";
import * as ruleService from "../services/rule.service.js";

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const examId = req.query.examId as string | undefined;
    res.json(await ruleService.listRules(examId));
  } catch (error) {
    next(error);
  }
}

export async function save(req: Request, res: Response, next: NextFunction) {
  try {
    const { examId, rules } = req.body;
    res.json(await ruleService.saveRules(String(examId), rules || []));
  } catch (error) {
    next(error);
  }
}

export async function simulate(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await ruleService.simulateRules(String(req.params.examId)));
  } catch (error) {
    next(error);
  }
}

export async function execute(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await ruleService.executeRules(String(req.params.examId)));
  } catch (error) {
    next(error);
  }
}
