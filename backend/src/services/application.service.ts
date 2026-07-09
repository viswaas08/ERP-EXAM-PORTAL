import { prisma } from "../config/prisma.js";

export function listApplications(query: { status?: string; search?: string; examId?: string; examCode?: string; page?: number; limit?: number }) {
  const page = Number(query.page ?? 1);
  const limit = Number(query.limit ?? 20);
  return prisma.application.findMany({
    where: {
      status: query.status,
      examinationId: query.examId,
      examination: query.examCode ? { code: query.examCode } : undefined,
      candidate: query.search ? { user: { name: { contains: query.search, mode: "insensitive" } } } : undefined
    },
    include: { candidate: { include: { user: true, profile: true } }, examination: true, documents: true, history: { orderBy: { createdAt: "asc" } } },
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { submittedAt: "desc" }
  });
}

export function updateApplicationStatus(id: string, status: string, remarks?: string) {
  const nextStatus = status.toUpperCase();
  return prisma.application.update({
    where: { id },
    data: {
      status: nextStatus,
      history: { create: { status: nextStatus, remarks: remarks ?? "" } }
    },
    include: { candidate: { include: { user: true, profile: true } }, examination: true, documents: true, history: { orderBy: { createdAt: "asc" } } }
  });
}
