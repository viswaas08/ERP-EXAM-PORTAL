import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";

export const WORKFLOW_PHASE_NAMES = ["Registration", "Correction Window", "Document Verification", "Eligibility Verification", "Hall Ticket Release", "Online Examination", "Evaluation", "Result Publication", "Archive"];

export function listExams(query: { search?: string; status?: string }) {
  return prisma.examination.findMany({
    where: {
      status: query.status || undefined,
      OR: query.search ? [{ name: { contains: query.search, mode: "insensitive" } }, { code: { contains: query.search, mode: "insensitive" } }] : undefined
    },
    include: { workflowPhases: true, _count: { select: { applications: true } } },
    orderBy: { createdAt: "desc" }
  });
}

function buildPhaseSchedule(startDate?: string, endDate?: string) {
  const start = startDate ? new Date(startDate) : new Date();
  const end = endDate ? new Date(endDate) : new Date(start.getTime() + WORKFLOW_PHASE_NAMES.length * 24 * 60 * 60 * 1000);
  const safeEnd = end.getTime() > start.getTime() ? end : new Date(start.getTime() + WORKFLOW_PHASE_NAMES.length * 24 * 60 * 60 * 1000);
  const phaseDuration = (safeEnd.getTime() - start.getTime()) / WORKFLOW_PHASE_NAMES.length;

  return WORKFLOW_PHASE_NAMES.map((name, index) => ({
    name,
    status: index === 0 ? "OPEN" : "SCHEDULED",
    opensAt: new Date(start.getTime() + index * phaseDuration),
    closesAt: new Date(start.getTime() + (index + 1) * phaseDuration)
  }));
}

export function listLiveExams() {
  return prisma.examination.findMany({
    where: { status: { in: ["OPEN", "ACTIVE", "PUBLISHED", "ONLINE"] } },
    include: { workflowPhases: { orderBy: { opensAt: "asc" } }, _count: { select: { applications: true, questionBanks: true, centres: true } } },
    orderBy: { createdAt: "desc" }
  });
}

export function createExam(data: any) {
  const { startDate, endDate, ...examData } = data;
  const name = examData.examName ?? examData.name ?? "Configurable Exam";
  const code = examData.examCode ?? examData.code ?? `EXAM-${Date.now()}`;

  const legacyFields = {
    name,
    code,
    durationMinutes: examData.duration ?? examData.durationMinutes ?? 120,
    maximumMarks: examData.totalMarks ?? examData.maximumMarks ?? 100,
    passingMarks: examData.passingMarks ?? 40,
    negativeMarking: examData.negativeMarkingEnabled ?? examData.negativeMarking ?? false,
  };

  return prisma.$transaction(async (tx) => {
    const created = await tx.examination.create({
      data: {
        ...examData,
        ...legacyFields,
        examDate: examData.examDate ? new Date(examData.examDate) : null,
        status: examData.status ?? "DRAFT",
        workflowPhases: {
          create: buildPhaseSchedule(startDate, endDate)
        }
      }
    });

    await tx.questionBank.create({
      data: {
        examId: created.id,
        name: `${created.code} Main Question Bank`
      }
    });

    return tx.examination.findUniqueOrThrow({
      where: { id: created.id },
      include: { workflowPhases: true, _count: { select: { applications: true } } }
    });
  });
}

export async function updateExam(id: string, data: any) {
  const { startDate, endDate, ...examData } = data;

  const legacyFields: any = {};
  if (examData.examName !== undefined) legacyFields.name = examData.examName;
  if (examData.examCode !== undefined) legacyFields.code = examData.examCode;
  if (examData.duration !== undefined) legacyFields.durationMinutes = examData.duration;
  if (examData.totalMarks !== undefined) legacyFields.maximumMarks = examData.totalMarks;
  if (examData.negativeMarkingEnabled !== undefined) legacyFields.negativeMarking = examData.negativeMarkingEnabled;

  return prisma.$transaction(async (tx) => {
    if (startDate || endDate) {
      const phases = await tx.workflowPhase.findMany({ where: { examId: id }, orderBy: { opensAt: "asc" } });
      const schedule = buildPhaseSchedule(startDate, endDate || phases.at(-1)?.closesAt.toISOString());
      for (const [index, phase] of phases.entries()) {
        const slot = schedule[index];
        if (!slot) continue;
        await tx.workflowPhase.update({
          where: { id: phase.id },
          data: { opensAt: slot.opensAt, closesAt: slot.closesAt }
        });
      }
    }

    const finalData = {
      ...examData,
      ...legacyFields,
    };
    if (examData.examDate) {
      finalData.examDate = new Date(examData.examDate);
    }

    if (examData.status === "PUBLISHED") {
      finalData.publishedAt = new Date();
    } else if (examData.status === "ONLINE" || examData.status === "OPEN" || examData.status === "ACTIVE") {
      finalData.onlineAt = new Date();
    } else if (examData.status === "ARCHIVED") {
      finalData.archivedAt = new Date();
    }

    return tx.examination.update({
      where: { id },
      data: finalData,
      include: { workflowPhases: true, _count: { select: { applications: true } } }
    });
  });
}

export function archiveExam(id: string) {
  return updateExam(id, { status: "ARCHIVED" });
}

export async function cloneExam(id: string) {
  const exam = await prisma.examination.findUniqueOrThrow({ where: { id }, include: { workflowPhases: true } });
  return prisma.$transaction(async (tx) => {
    const created = await tx.examination.create({
      data: {
        name: `${exam.name} Copy`,
        code: `${exam.code}-COPY-${Date.now()}`,
        examName: exam.examName ? `${exam.examName} Copy` : `${exam.name} Copy`,
        examCode: exam.examCode ? `${exam.examCode}-COPY-${Date.now()}` : `${exam.code}-COPY-${Date.now()}`,
        description: exam.description,
        department: exam.department,
        course: exam.course,
        semester: exam.semester,
        subject: exam.subject,
        examType: exam.examType,
        examDate: exam.examDate,
        startTime: exam.startTime,
        duration: exam.duration,
        instructions: exam.instructions,
        questionBank: exam.questionBank,
        totalQuestions: exam.totalQuestions,
        totalMarks: exam.totalMarks,
        passingMarks: exam.passingMarks,
        negativeMarkingEnabled: exam.negativeMarkingEnabled,
        negativeMarks: exam.negativeMarks,
        randomizeQuestions: exam.randomizeQuestions,
        randomizeOptions: exam.randomizeOptions,
        allowResume: exam.allowResume,
        durationMinutes: exam.durationMinutes,
        maximumMarks: exam.maximumMarks,
        negativeMarking: exam.negativeMarking,
        languages: exam.languages,
        status: "DRAFT",
        workflowPhases: { create: exam.workflowPhases.map((phase) => ({ name: phase.name, status: "SCHEDULED", opensAt: phase.opensAt, closesAt: phase.closesAt })) }
      }
    });

    await tx.questionBank.create({
      data: {
        examId: created.id,
        name: `${created.code} Main Question Bank`
      }
    });

    return tx.examination.findUniqueOrThrow({
      where: { id: created.id },
      include: { workflowPhases: true, _count: { select: { applications: true } } }
    });
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
    const exam = await tx.examination.findUnique({ where: { id: examId } });
    if (!exam) throw new AppError(404, "Examination not found");

    await tx.workflowPhase.updateMany({
      where: { examId },
      data: { status: "SCHEDULED" }
    });

    const activated = await tx.workflowPhase.update({
      where: { id: phaseId },
      data: { status: "OPEN" }
    });

    if (activated.name === "Online Examination") {
      await tx.examination.update({
        where: { id: examId },
        data: { status: "ONLINE", onlineAt: new Date() }
      });
    }

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
    : await prisma.examination.findFirst({ where: { status: { in: ["ONLINE", "OPEN", "ACTIVE"] } }, include: { workflowPhases: { orderBy: { opensAt: "asc" } } }, orderBy: { createdAt: "desc" } });

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
    onlineExam: normalized.includes("online examination") && (exam.status === "ONLINE" || exam.status === "OPEN" || exam.status === "ACTIVE"),
    evaluation: normalized.includes("evaluation"),
    result: normalized.includes("result"),
    archiveDownloads: normalized.includes("archive")
  };

  return {
    exam: {
      id: exam.id,
      code: exam.code,
      name: exam.name,
      durationMinutes: exam.durationMinutes,
      examName: exam.examName || exam.name,
      examCode: exam.examCode || exam.code,
      maximumAttempts: exam.maximumAttempts,
      allowResume: exam.allowResume,
      status: exam.status,
      totalQuestions: exam.totalQuestions,
      totalMarks: exam.totalMarks,
      passingMarks: exam.passingMarks,
      negativeMarkingEnabled: exam.negativeMarkingEnabled,
      negativeMarks: exam.negativeMarks,
      instructions: exam.instructions
    },
    activePhase,
    access,
    phases: exam.workflowPhases
  };
}
