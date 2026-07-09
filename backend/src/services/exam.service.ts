import { prisma } from "../config/prisma.js";

export function listExams(query: { search?: string; status?: string }) {
  return prisma.examination.findMany({
    where: {
      status: query.status,
      OR: query.search ? [{ name: { contains: query.search, mode: "insensitive" } }, { code: { contains: query.search, mode: "insensitive" } }] : undefined
    },
    include: { workflowPhases: true },
    orderBy: { createdAt: "desc" }
  });
}

export function createExam(data: any) {
  return prisma.examination.create({ data });
}

export async function cloneExam(id: string) {
  const exam = await prisma.examination.findUniqueOrThrow({ where: { id }, include: { workflowPhases: true } });
  return prisma.examination.create({
    data: {
      name: `${exam.name} Copy`,
      code: `${exam.code}-COPY-${Date.now()}`,
      description: exam.description,
      department: exam.department,
      durationMinutes: exam.durationMinutes,
      maximumMarks: exam.maximumMarks,
      passingMarks: exam.passingMarks,
      negativeMarking: exam.negativeMarking,
      languages: exam.languages,
      status: "DRAFT",
      workflowPhases: { create: exam.workflowPhases.map((phase) => ({ name: phase.name, status: "SCHEDULED", opensAt: phase.opensAt, closesAt: phase.closesAt })) }
    }
  });
}
