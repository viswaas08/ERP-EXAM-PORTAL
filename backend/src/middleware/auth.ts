import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

export interface AuthRequest extends Request {
  user?: { id: string; role: string; permissions: string[] };
}

export function authenticate(req: AuthRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) throw new AppError(401, "Authentication required");
  req.user = jwt.verify(header.slice(7), env.jwtSecret) as AuthRequest["user"];
  next();
}

export function authorize(permission: string) {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user?.permissions?.includes(permission) && req.user?.role !== "Super Admin") throw new AppError(403, "Permission denied");
    next();
  };
}
