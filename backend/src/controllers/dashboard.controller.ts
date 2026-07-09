import type { Request, Response } from "express";
import { prisma } from "../config/prisma.js";

export async function summary(_req: Request, res: Response) {
  const [examinations, candidates, applications, approved, pending, rejected, hallTickets, results] = await Promise.all([
    prisma.examination.count(),
    prisma.candidate.count(),
    prisma.application.count(),
    prisma.application.count({ where: { status: "APPROVED" } }),
    prisma.application.count({ where: { status: "PENDING" } }),
    prisma.application.count({ where: { status: "REJECTED" } }),
    prisma.hallTicket.count(),
    prisma.result.count()
  ]);
  res.json({ examinations, candidates, applications, approved, pending, rejected, hallTickets, results });
}
