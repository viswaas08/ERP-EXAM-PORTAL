import type { NextFunction, Request, Response } from "express";
import { prisma } from "../config/prisma.js";

export function audit(action: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    res.on("finish", () => {
      if (res.statusCode < 400) {
        void prisma.auditLog.create({
          data: {
            action,
            role: "SYSTEM",
            userEmail: "api",
            affectedRecord: req.originalUrl,
            ipAddress: req.ip,
            newValue: JSON.stringify(req.body ?? {})
          }
        }).catch(() => undefined);
      }
    });
    next();
  };
}
