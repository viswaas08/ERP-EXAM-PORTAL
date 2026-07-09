import { prisma } from "../config/prisma.js";

export function listApplications(query: { status?: string; search?: string; page?: number; limit?: number }) {
  const page = Number(query.page ?? 1);
  const limit = Number(query.limit ?? 20);
  return prisma.application.findMany({
    where: {
      status: query.status,
      candidate: query.search ? { user: { name: { contains: query.search, mode: "insensitive" } } } : undefined
    },
    include: { candidate: { include: { user: true } }, examination: true, documents: true },
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { submittedAt: "desc" }
  });
}

export function updateApplicationStatus(id: string, status: string, remarks?: string) {
  return prisma.application.update({
    where: { id },
    data: {
      status,
      history: { create: { status, remarks: remarks ?? "" } }
    }
  });
}
