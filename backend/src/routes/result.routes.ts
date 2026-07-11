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
  // Auto-heal/migrate legacy ExamSessions with status SUBMITTED to new ExamAttempts
  const sessions = await prisma.examSession.findMany({
    where: { examId: examId || undefined, status: "SUBMITTED" }
  });
  for (const session of sessions) {
    const app = await prisma.application.findUnique({
      where: { id: session.applicationId }
    });
    if (!app) continue;

    const hasAttempt = await prisma.examAttempt.findFirst({
      where: { studentId: app.candidateId, examId: session.examId }
    });
    if (hasAttempt) continue;

    const responses = await prisma.candidateResponse.findMany({
      where: { sessionId: session.id },
      include: { question: { include: { options: true } } }
    });

    const exam = await prisma.examination.findUnique({
      where: { id: session.examId }
    });
    if (!exam) continue;

    let score = 0;
    const answers: Record<string, string> = {};

    for (const resp of responses) {
      const ans = resp.answer as { optionId?: string } | null;
      if (ans && ans.optionId) {
        answers[resp.questionId] = ans.optionId;
        const selectedOption = resp.question.options.find(o => o.id === ans.optionId);
        if (selectedOption?.isCorrect) {
          score += resp.question.marks;
        } else {
          score -= resp.question.negativeMarks;
        }
      }
    }

    const totalQuestions = responses.length || 1;
    const maxPossibleMarks = exam.maximumMarks || (totalQuestions * 2);
    const percentage = maxPossibleMarks > 0 ? Math.max(0, (score / maxPossibleMarks) * 100) : 0;

    await prisma.examAttempt.create({
      data: {
        attemptNumber: 1,
        studentId: app.candidateId,
        examId: session.examId,
        answers,
        score,
        percentage,
        resultStatus: percentage >= exam.passingMarks ? "PASS" : "FAIL",
        evaluationStatus: "COMPLETED",
        published: false,
        timeTaken: 1200
      }
    });
  }

  const applications = await prisma.application.findMany({
    where: { examinationId: examId || undefined }
  });

  const evaluated = [];
  for (const application of applications) {
    const latestAttempt = await prisma.examAttempt.findFirst({
      where: { studentId: application.candidateId, examId: application.examinationId },
      orderBy: { attemptNumber: "desc" }
    });
    if (!latestAttempt) continue;

    const result = await prisma.result.upsert({
      where: { applicationId: application.id },
      create: {
        applicationId: application.id,
        examId: application.examinationId,
        marks: latestAttempt.score,
        percentage: latestAttempt.percentage,
        rank: latestAttempt.rank || 0,
        percentile: latestAttempt.percentage,
        qualified: latestAttempt.resultStatus === "PASS",
        status: "DRAFT"
      },
      update: {
        marks: latestAttempt.score,
        percentage: latestAttempt.percentage,
        rank: latestAttempt.rank || 0,
        percentile: latestAttempt.percentage,
        qualified: latestAttempt.resultStatus === "PASS"
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
    where: { status: { in: ["OPEN", "ACTIVE", "LIVE", "PUBLISHED", "ONLINE", "COMPLETED", "RESULTS_PUBLISHED", "ARCHIVED", "DRAFT"] } },
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

resultRoutes.get("/attempts", authenticate, async (req, res) => {
  const examId = String(req.query.examId || "");
  const attempts = await prisma.examAttempt.findMany({
    where: { examId: examId || undefined },
    include: { candidate: { include: { user: true } } },
    orderBy: { submittedAt: "desc" }
  });

  res.json(attempts.map((attempt) => ({
    ...attempt,
    candidateName: attempt.candidate.user.name || attempt.candidate.user.email,
    candidateEmail: attempt.candidate.user.email
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

resultRoutes.post("/evaluate", authenticate, authorize("result:publish", "officer:result:publish"), async (req, res) => {
  const examId = String(req.body.examId || "");
  if (!examId) return res.status(400).json({ message: "Select an examination before evaluating results" });

  const evaluated = await evaluateApplications(examId);
  res.status(201).json({ evaluated: evaluated.length });
});

resultRoutes.post("/publish", authenticate, authorize("result:publish", "officer:result:publish"), async (req, res) => {
  const examId = String(req.body.examId || "");
  if (!examId) return res.status(400).json({ message: "Select an examination before publishing results" });

  await evaluateApplications(examId);
  const updated = await prisma.result.updateMany({
    where: { examId },
    data: { status: "PUBLISHED" }
  });

  const latestAttempts = await prisma.examAttempt.findMany({
    where: { examId }
  });

  const studentLatestIds = new Map<string, string>();
  for (const attempt of latestAttempts) {
    const current = studentLatestIds.get(attempt.studentId);
    if (!current || attempt.attemptNumber > latestAttempts.find(a => a.id === current)!.attemptNumber) {
      studentLatestIds.set(attempt.studentId, attempt.id);
    }
  }

  if (studentLatestIds.size > 0) {
    await prisma.examAttempt.updateMany({
      where: { id: { in: Array.from(studentLatestIds.values()) } },
      data: { published: true }
    });
    await prisma.examAttempt.updateMany({
      where: { examId, id: { notIn: Array.from(studentLatestIds.values()) } },
      data: { published: false }
    });
  }

  const phase = await activateResultPublicationPhase(examId);
  res.json({ published: updated.count, activePhase: phase });
});

resultRoutes.post("/unpublish", authenticate, authorize("result:publish", "officer:result:publish"), async (req, res) => {
  const examId = String(req.body.examId || "");
  if (!examId) return res.status(400).json({ message: "Select an examination before unpublishing results" });

  const updated = await prisma.result.updateMany({
    where: { examId },
    data: { status: "DRAFT" }
  });

  await prisma.examAttempt.updateMany({
    where: { examId },
    data: { published: false }
  });

  const evalPhase = await prisma.workflowPhase.findFirst({
    where: { examId, name: "Evaluation" }
  });
  let phase = null;
  if (evalPhase) {
    phase = await prisma.$transaction(async (tx) => {
      await tx.workflowPhase.updateMany({
        where: { examId },
        data: { status: "SCHEDULED" }
      });
      return tx.workflowPhase.update({
        where: { id: evalPhase.id },
        data: { status: "OPEN" }
      });
    });
  }

  res.json({ unpublished: updated.count, activePhase: phase });
});

resultRoutes.post("/republish", authenticate, authorize("result:publish", "officer:result:publish"), async (req, res) => {
  const examId = String(req.body.examId || "");
  if (!examId) return res.status(400).json({ message: "Select an examination before republishing results" });

  const evaluated = await evaluateApplications(examId);
  const updated = await prisma.result.updateMany({
    where: { examId },
    data: { status: "PUBLISHED" }
  });

  const latestAttempts = await prisma.examAttempt.findMany({
    where: { examId }
  });

  const studentLatestIds = new Map<string, string>();
  for (const attempt of latestAttempts) {
    const current = studentLatestIds.get(attempt.studentId);
    if (!current || attempt.attemptNumber > latestAttempts.find(a => a.id === current)!.attemptNumber) {
      studentLatestIds.set(attempt.studentId, attempt.id);
    }
  }

  if (studentLatestIds.size > 0) {
    await prisma.examAttempt.updateMany({
      where: { id: { in: Array.from(studentLatestIds.values()) } },
      data: { published: true }
    });
    await prisma.examAttempt.updateMany({
      where: { examId, id: { notIn: Array.from(studentLatestIds.values()) } },
      data: { published: false }
    });
  }

  const phase = await activateResultPublicationPhase(examId);
  res.json({ republished: updated.count, activePhase: phase });
});

resultRoutes.get("/:id/score-card.pdf", authenticate, async (req, res) => {
  const result = await prisma.result.findUnique({
    where: { id: String(req.params.id) },
    include: { application: { include: { candidate: { include: { user: true } }, examination: true } } }
  });

  if (!result) {
    return streamPortalPdf(res, "Score Card", [`Result ID: ${req.params.id}`, "Result not found"]);
  }

  const setting = await prisma.systemSetting.findUnique({
    where: { key: `rankThreshold_${result.examId}` }
  });
  const rankThreshold = setting?.value !== null && setting?.value !== undefined && !isNaN(Number(setting.value)) ? Number(setting.value) : 500;

  const eligibility = result.qualified
    ? (result.rank <= rankThreshold
      ? "you are eligible for the admission process pleasse procced with the instruction"
      : "not eligible for the admission.")
    : "you are not eligible for the admission";

  streamPortalPdf(res, "Score Card", [
    `Application No: ${result.application.applicationNo}`,
    `Candidate: ${result.application.candidate.user.name}`,
    `Examination: ${result.application.examination.name}`,
    `Marks: ${result.marks}`,
    `Percentage: ${result.percentage.toFixed(2)}`,
    `Rank: ${result.rank}`,
    `Qualified: ${result.qualified ? "Yes" : "No"}`,
    `Status: ${result.status}`,
    `Admission Eligibility: ${eligibility}`
  ]);
});
