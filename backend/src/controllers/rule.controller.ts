import type { Request, Response } from "express";
import * as ruleService from "../services/rule.service.js";

export async function list(req: Request, res: Response) {
  res.json(await ruleService.listRules(req.query.examId as string | undefined));
}

export async function simulate(req: Request, res: Response) {
  res.json(await ruleService.simulateRules(String(req.params.examId)));
}
