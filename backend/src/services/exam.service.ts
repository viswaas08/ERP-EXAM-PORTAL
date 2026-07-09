import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";

export function listExams(query: { search?: string; status?: string }) {
  return prisma.examination.findMany({
    where: {
      status: query.status,
      OR: query.search ? [{ name: { contains: query.search, mode: "insensitive" } }, { code: { contains: query.search, mode: "insensitive" } }] : undefined
    },
    include: { workflowPhases: true, _count: { select: { applications: true } } },
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

export function listWorkflowPhases(examId: string) {
  return prisma.workflowPhase.findMany({
    where: { examId },
    orderBy: { opensAt: "asc" }
  });
}

export async function activateWorkflowPhase(examId: string, phaseId: string) {
  const phase = await prisma.workflowPhase.findFirst({ where: { id: phaseId, examId } });
  if (!phase) throw new AppError(404, "Workflow phase not found");

  return prisma.$transaction(async (tx) => {
    await tx.workflowPhase.updateMany({
      where: { examId },
      data: { status: "SCHEDULED" }
    });

    const activated = await tx.workflowPhase.update({
      where: { id: phaseId },
      data: { status: "OPEN" }
    });

    await tx.auditLog.create({
      data: {
        userEmail: "api",
        role: "SYSTEM",
        action: "WORKFLOW_PHASE_ACTIVATED",
        affectedRecord: `${examId}:${phaseId}`,
        oldValue: "{}",
        newValue: JSON.stringify({ phase: activated.name, status: activated.status })
      }
    });

    return activated;
  });
}

export async function getCandidatePhaseSnapshot(examId?: string) {
  const exam = examId
    ? await prisma.examination.findUnique({ where: { id: examId }, include: { workflowPhases: { orderBy: { opensAt: "asc" } } } })
    : await prisma.examination.findFirst({ where: { status: { in: ["OPEN", "ACTIVE"] } }, include: { workflowPhases: { orderBy: { opensAt: "asc" } } }, orderBy: { createdAt: "desc" } });

  if (!exam) throw new AppError(404, "No active examination found");

  const activePhase = exam.workflowPhases.find((phase) => phase.status === "OPEN") ?? exam.workflowPhases[0];
  const phaseName = activePhase?.name ?? "Registration";
  const normalized = phaseName.toLowerCase();

  const access = {
    registration: normalized.includes("registration"),
    correction: normalized.includes("correction"),
    documentVerification: normalized.includes("document"),
    eligibilityVerification: normalized.includes("eligibility"),
    hallTicket: normalized.includes("hall ticket"),
    onlineExam: normalized.includes("online examination") || normalized.includes("examination"),
    result: normalized.includes("result"),
    archiveDownloads: normalized.includes("archive")
  };

  return {
    exam: { id: exam.id, code: exam.code, name: exam.name },
    activePhase,
    access,
    phases: exam.workflowPhases
  };
}
