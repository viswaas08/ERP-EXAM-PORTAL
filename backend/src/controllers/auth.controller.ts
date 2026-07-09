import type { Request, Response } from "express";
import { loginSchema } from "../validators/auth.validator.js";
import * as authService from "../services/auth.service.js";

export async function login(req: Request, res: Response) {
  const body = loginSchema.parse(req.body);
  res.json(await authService.login(body.email, body.password));
}
