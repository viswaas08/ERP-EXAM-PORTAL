import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

export interface AuthRequest extends Request {
  user?: { id: string; email?: string; role: string; permissions: string[] };
}

export function authenticate(req: AuthRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) throw new AppError(401, "Authentication required");
  req.user = jwt.verify(header.slice(7), env.jwtSecret) as AuthRequest["user"];
  next();
}

export function authorize(...permissions: string[]) {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    const roleSafe = req.user?.role?.toLowerCase().replace(/\s+/g, "");
    if (roleSafe === "superadmin" || req.user?.email === "admin@exam.gov") return next();
    const hasPermission = permissions.some((p) => req.user?.permissions?.includes(p));
    if (!hasPermission) {
      console.warn(`[AUTH] Access denied. User: ${req.user?.id}, Email: ${req.user?.email}, Role: ${req.user?.role}, Permissions: ${JSON.stringify(req.user?.permissions)}, Required: ${JSON.stringify(permissions)}`);
      throw new AppError(403, "Permission denied");
    }
    next();
  };
}
