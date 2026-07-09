import { Router } from "express";
import { prisma } from "../config/prisma.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { streamPortalPdf } from "../services/pdf.service.js";

export const resultRoutes = Router();

function candidateName(application: { candidate: { user: { name?: string | null; email?: string | null } } }) {
  const name = application.candidate.user.name?.trim();
  return name || application.candidate.user.email || "Unknown Candidate";
}

async function activateResultPublicationPhase(examId: string) {
  const resultPhase = await prisma.workflowPhase.findFirst({
    where: { examId, name: "Result Publication" }
  });
  if (!resultPhase) return null;

  return prisma.$transaction(async (tx) => {
    await tx.workflowPhase.updateMany({
      where: { examId },
      data: { status: "SCHEDULED" }
    });

    return tx.workflowPhase.update({
      where: { id: resultPhase.id },
      data: { status: "OPEN" }
    });
  });
}

async function evaluateApplications(examId?: string) {
  const applications = await prisma.application.findMany({
    where: { examinationId: examId || undefined }
  });

  const evaluated = [];
  for (const application of applications) {
    const session = await prisma.examSession.findFirst({
      where: { applicationId: application.id, status: "SUBMITTED" },
      include: {
        responses: {
          include: {
            question: { include: { options: true } }
          }
        }
      },
      orderBy: { submittedAt: "desc" }
    });
    if (!session) continue;

    let marks = 0;
    let maximumMarks = 0;
    for (const response of session.responses) {
      maximumMarks += response.question.marks;
      const answer = response.answer as { optionId?: string } | null;
      const selected = response.question.options.find((option) => option.id === answer?.optionId);
      marks += selected?.isCorrect ? response.question.marks : -Math.abs(response.question.negativeMarks || 0);
    }

    const percentage = maximumMarks ? Math.max(0, (marks / maximumMarks) * 100) : 0;
    const result = await prisma.result.upsert({
      where: { applicationId: application.id },
      create: {
        applicationId: application.id,
        examId: application.examinationId,
        marks: Math.max(0, marks),
        percentage,
        rank: 0,
        percentile: percentage,
        qualified: percentage >= 40,
        status: "DRAFT"
      },
      update: {
        marks: Math.max(0, marks),
        percentage,
        percentile: percentage,
        qualified: percentage >= 40
      }
    });
    evaluated.push(result);
  }

  const ranked = await prisma.result.findMany({
    where: { examId: examId || undefined },
    orderBy: [{ marks: "desc" }, { percentage: "desc" }]
  });
  for (const [index, result] of ranked.entries()) {
    await prisma.result.update({ where: { id: result.id }, data: { rank: index + 1 } });
  }

  return evaluated;
}

resultRoutes.get("/exams", authenticate, async (_req, res) => {
  const exams = await prisma.examination.findMany({
    where: { status: { in: ["OPEN", "ACTIVE", "LIVE"] } },
    include: {
      workflowPhases: { orderBy: { opensAt: "asc" } },
      _count: { select: { applications: true, sessions: true, results: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  res.json(exams.map((exam) => ({
    id: exam.id,
    code: exam.code,
    name: exam.name,
    status: exam.status,
    activePhase: exam.workflowPhases.find((phase) => phase.status === "OPEN") ?? exam.workflowPhases[0] ?? null,
    applications: exam._count.applications,
    submissions: exam._count.sessions,
    results: exam._count.results
  })));
});

resultRoutes.get("/", authenticate, async (req, res) => {
  const examId = String(req.query.examId || "");
  const results = await prisma.result.findMany({
    where: { examId: examId || undefined },
    include: { application: { include: { candidate: { include: { user: true } }, examination: true } }, exam: true },
    orderBy: [{ rank: "asc" }, { marks: "desc" }]
  });
  res.json(results.map((result) => ({
    ...result,
    candidateName: candidateName(result.application),
    candidateEmail: result.application.candidate.user.email
  })));
});

resultRoutes.get("/submissions", authenticate, async (req, res) => {
  const examId = String(req.query.examId || "");
  const sessions = await prisma.examSession.findMany({
    where: {
      examId: examId || undefined,
      status: "SUBMITTED"
    },
    include: {
      responses: {
        include: {
          question: {
            include: {
              options: true,
              subject: true,
              topic: true
            }
          }
        },
        orderBy: { savedAt: "asc" }
      }
    },
    orderBy: { submittedAt: "desc" }
  });

  const applications = await prisma.application.findMany({
    where: { id: { in: sessions.map((session) => session.applicationId) } },
    include: { candidate: { include: { user: true } }, examination: true }
  });
  const applicationById = new Map(applications.map((application) => [application.id, application]));

  res.json(sessions.map((session) => {
    const application = applicationById.get(session.applicationId) ?? null;
    return {
      ...session,
      application,
      candidateName: application ? candidateName(application) : "Unknown Candidate",
      candidateEmail: application?.candidate.user.email ?? null
    };
  }));
});

resultRoutes.post("/evaluate", authenticate, authorize("result:publish"), async (req, res) => {
  const examId = String(req.body.examId || "");
  if (!examId) return res.status(400).json({ message: "Select an examination before evaluating results" });

  const evaluated = await evaluateApplications(examId);
  res.status(201).json({ evaluated: evaluated.length });
});

resultRoutes.post("/publish", authenticate, authorize("result:publish"), async (req, res) => {
  const examId = String(req.body.examId || "");
  if (!examId) return res.status(400).json({ message: "Select an examination before publishing results" });

  await evaluateApplications(examId);
  const updated = await prisma.result.updateMany({
    where: { examId },
    data: { status: "PUBLISHED" }
  });
  const phase = await activateResultPublicationPhase(examId);
  res.json({ published: updated.count, activePhase: phase });
});

resultRoutes.get("/:id/score-card.pdf", authenticate, async (req, res) => {
  const result = await prisma.result.findUnique({
    where: { id: String(req.params.id) },
    include: { application: { include: { candidate: { include: { user: true } }, examination: true } } }
  });
  streamPortalPdf(res, "Score Card", result ? [
    `Application No: ${result.application.applicationNo}`,
    `Candidate: ${result.application.candidate.user.name}`,
    `Examination: ${result.application.examination.name}`,
    `Marks: ${result.marks}`,
    `Percentage: ${result.percentage.toFixed(2)}`,
    `Rank: ${result.rank}`,
    `Qualified: ${result.qualified ? "Yes" : "No"}`,
    `Status: ${result.status}`
  ] : [`Result ID: ${req.params.id}`, "Result not found"]);
});
