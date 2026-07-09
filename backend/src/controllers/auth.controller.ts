import type { Request, Response } from "express";
import { loginSchema, resetPasswordSchema } from "../validators/auth.validator.js";
import * as authService from "../services/auth.service.js";

export async function login(req: Request, res: Response) {
  const body = loginSchema.parse(req.body);
  res.json(await authService.login(body.email, body.password));
}

export async function resetPassword(req: Request, res: Response) {
  const body = resetPasswordSchema.parse(req.body);
  res.json(await authService.resetPassword(body.email, body.password));
}
