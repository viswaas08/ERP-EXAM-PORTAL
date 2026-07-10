import { Router } from "express";
import { prisma } from "../config/prisma.js";
import { authenticate, type AuthRequest } from "../middleware/auth.js";
import { getCandidatePhaseSnapshot } from "../services/exam.service.js";
import { AppError } from "../utils/AppError.js";

export const questionRoutes = Router();

function questionNumber(tags: string[]) {
  const tag = tags.find((item) => /^Q\d+$/.test(item));
  return tag ? Number(tag.slice(1)) : 0;
}

async function getCandidateIds(user: { id: string; email?: string }) {
  const userEmail = user.email || "";
  const emailPrefix = userEmail.split("@")[0] || "";
  const basePrefix = emailPrefix.replace(/\d+$/, "");
  const usePrefixSearch = basePrefix.length >= 3;

  const similarUsers = await prisma.user.findMany({
    where: usePrefixSearch
      ? { email: { startsWith: basePrefix, mode: "insensitive" } }
      : { email: userEmail }
  });
  const userIds = similarUsers.map((u) => u.id);

  const candidates = await prisma.candidate.findMany({
    where: { userId: { in: userIds } },
    select: { id: true }
  });
  return candidates.map((c) => c.id);
}

questionRoutes.get("/bank", authenticate, async (_req, res) => {
  const bankId = String(_req.query.bankId || "");
  const examId = String(_req.query.examId || "");
  const questions = await prisma.question.findMany({
    where: bankId ? { bankId } : examId ? { bank: { examId } } : undefined,
    include: {
      subject: true,
      topic: true,
      bank: { include: { exam: true } },
      options: true
    }
  });

  res.json(questions.sort((a, b) => questionNumber(a.tags) - questionNumber(b.tags)));
});

questionRoutes.get("/banks", authenticate, async (req, res) => {
  const examId = String(req.query.examId || "");
  const banks = await prisma.questionBank.findMany({
    where: examId ? { examId } : undefined,
    include: { exam: true, _count: { select: { questions: true } } },
    orderBy: [{ name: "asc" }]
  });

  res.json(banks);
});

questionRoutes.post("/banks/import", authenticate, async (req: AuthRequest, res) => {
  if (!req.user) throw new AppError(401, "Authentication required");
  const sourceBankId = String(req.body.sourceBankId || "");
  const targetExamId = String(req.body.targetExamId || "");
  if (!sourceBankId) throw new AppError(400, "Source question bank is required");
  if (!targetExamId) throw new AppError(400, "Target examination is required");

  const source = await prisma.questionBank.findUnique({
    where: { id: sourceBankId },
    include: {
      exam: true,
      questions: {
        include: {
          subject: true,
          topic: true,
          options: true
        }
      }
    }
  });
  if (!source) throw new AppError(404, "Source question bank not found");

  const targetExam = await prisma.examination.findUnique({ where: { id: targetExamId } });
  if (!targetExam) throw new AppError(404, "Target examination not found");

  // Enforce one question bank limit
  const existingBanks = await prisma.questionBank.findMany({
    where: { examId: targetExamId },
    include: { _count: { select: { questions: true } } }
  });

  if (existingBanks.length > 0) {
    const withQuestions = existingBanks.filter((b) => b._count.questions > 0);
    if (withQuestions.length > 0) {
      throw new AppError(400, "The target examination already has an assigned question bank with questions. Only one question bank can be assigned per exam.");
    } else {
      // Clean up empty banks
      await prisma.questionBank.deleteMany({
        where: { id: { in: existingBanks.map((b) => b.id) } }
      });
    }
  }

  const imported = await prisma.$transaction(async (tx) => {
    const bank = await tx.questionBank.create({
      data: {
        examId: targetExam.id,
        name: `${source.name} - Imported`
      },
      include: { exam: true, _count: { select: { questions: true } } }
    });

    for (const question of source.questions) {
      await tx.question.create({
        data: {
          bankId: bank.id,
          subjectId: question.subjectId,
          topicId: question.topicId,
          questionType: question.questionType,
          prompt: question.prompt,
          imageUrl: question.imageUrl,
          difficulty: question.difficulty,
          explanation: question.explanation,
          marks: question.marks,
          negativeMarks: question.negativeMarks,
          tags: question.tags,
          options: {
            create: question.options.map((option) => ({
              text: option.text,
              isCorrect: option.isCorrect
            }))
          }
        }
      });
    }

    return tx.questionBank.findUniqueOrThrow({
      where: { id: bank.id },
      include: { exam: true, _count: { select: { questions: true } } }
    });
  }, { timeout: 60000 });

  res.status(201).json(imported);
});

questionRoutes.patch("/banks/:id/assign", authenticate, async (req: AuthRequest, res) => {
  if (!req.user) throw new AppError(401, "Authentication required");
  const bankId = String(req.params.id);
  const targetExamId = String(req.body.targetExamId || "").trim();

  const bank = await prisma.questionBank.findUnique({
    where: { id: bankId }
  });
  if (!bank) throw new AppError(404, "Question bank not found");

  if (!targetExamId) {
    const updated = await prisma.questionBank.update({
      where: { id: bankId },
      data: { examId: null },
      include: { exam: true, _count: { select: { questions: true } } }
    });
    res.json(updated);
    return;
  }

  const targetExam = await prisma.examination.findUnique({ where: { id: targetExamId } });
  if (!targetExam) throw new AppError(404, "Target examination not found");

  // Enforce one question bank limit
  const existingBanks = await prisma.questionBank.findMany({
    where: { examId: targetExamId },
    include: { _count: { select: { questions: true } } }
  });

  const otherBanks = existingBanks.filter((b) => b.id !== bankId);
  if (otherBanks.length > 0) {
    const withQuestions = otherBanks.filter((b) => b._count.questions > 0);
    if (withQuestions.length > 0) {
      throw new AppError(400, "The target examination already has an assigned question bank with questions. Only one question bank can be assigned per exam.");
    } else {
      // Clean up empty banks
      await prisma.questionBank.deleteMany({
        where: { id: { in: otherBanks.map((b) => b.id) } }
      });
    }
  }

  const updated = await prisma.questionBank.update({
    where: { id: bankId },
    data: { examId: targetExamId },
    include: { exam: true, _count: { select: { questions: true } } }
  });

  res.json(updated);
});

questionRoutes.get("/online/active", authenticate, async (req: AuthRequest, res) => {
  if (!req.user) throw new AppError(401, "Authentication required");
  let examId = String(req.query.examId || "").trim();

  const candidateIds = await getCandidateIds(req.user);
  if (!examId && candidateIds.length > 0) {
    const latestApp = await prisma.application.findFirst({
      where: { candidateId: { in: candidateIds } },
      orderBy: { submittedAt: "desc" },
      select: { examinationId: true }
    });
    if (latestApp) {
      examId = latestApp.examinationId;
    }
  }

  const snapshot = await getCandidatePhaseSnapshot(examId || undefined);

  const application = candidateIds.length > 0 ? await prisma.application.findFirst({
    where: { candidateId: { in: candidateIds }, examinationId: snapshot.exam.id, status: { in: ["APPROVED", "PENDING"] } },
    orderBy: { submittedAt: "desc" }
  }) : null;

  let activeSession = null;
  if (application) {
    activeSession = await prisma.examSession.findFirst({
      where: { applicationId: application.id, examId: snapshot.exam.id, status: "STARTED" },
      orderBy: { startedAt: "desc" }
    });
  }

  const questions = await prisma.question.findMany({
    where: { bank: { examId: snapshot.exam.id } },
    include: {
      subject: true,
      topic: true,
      options: { select: { id: true, text: true } }
    }
  });

  // attempts remaining
  let attemptsRemaining = snapshot.exam.maximumAttempts || 1;
  if (application) {
    const attemptCount = await prisma.examAttempt.count({
      where: { studentId: application.candidateId, examId: snapshot.exam.id }
    });
    attemptsRemaining = Math.max(0, (snapshot.exam.maximumAttempts || 1) - attemptCount);
  }

  res.json({
    exam: snapshot.exam,
    activePhase: snapshot.activePhase,
    access: snapshot.access,
    activeSession: activeSession ? {
      sessionId: activeSession.id,
      startedAt: activeSession.startedAt ?? new Date()
    } : null,
    attemptsRemaining,
    questions: questions
      .sort((a, b) => questionNumber(a.tags) - questionNumber(b.tags))
      .map((question) => ({
        id: question.id,
        number: questionNumber(question.tags),
        subject: question.subject.name,
        topic: question.topic.name,
        questionType: question.questionType,
        prompt: question.prompt,
        difficulty: question.difficulty,
        marks: question.marks,
        negativeMarks: question.negativeMarks,
        options: question.options
      }))
  });
});

questionRoutes.post("/online/start", authenticate, async (req: AuthRequest, res) => {
  if (!req.user) throw new AppError(401, "Authentication required");
  
  const candidateIds = await getCandidateIds(req.user);
  if (candidateIds.length === 0) throw new AppError(404, "Candidate profile not found");

  let examId = String(req.body.examId || "").trim();
  if (!examId) {
    const latestApp = await prisma.application.findFirst({
      where: { candidateId: { in: candidateIds } },
      orderBy: { submittedAt: "desc" },
      select: { examinationId: true }
    });
    if (latestApp) {
      examId = latestApp.examinationId;
    }
  }

  const snapshot = await getCandidatePhaseSnapshot(examId || undefined);
  if (!snapshot.access.onlineExam) throw new AppError(400, "Online examination is not active");

  const application = await prisma.application.findFirst({
    where: { candidateId: { in: candidateIds }, examinationId: snapshot.exam.id, status: { in: ["APPROVED", "PENDING"] } },
    orderBy: { submittedAt: "desc" }
  });
  if (!application) throw new AppError(404, "No application found for this examination");

  // Check attempt limit
  const attemptCount = await prisma.examAttempt.count({
    where: { studentId: application.candidateId, examId: snapshot.exam.id }
  });

  if (attemptCount >= (snapshot.exam.maximumAttempts || 1)) {
    throw new AppError(400, `Maximum attempt limit of ${snapshot.exam.maximumAttempts} reached for this exam.`);
  }

  // Check if there is an active session that is started but not submitted
  const activeSession = await prisma.examSession.findFirst({
    where: { applicationId: application.id, examId: snapshot.exam.id, status: "STARTED" },
    orderBy: { startedAt: "desc" }
  });

  if (activeSession) {
    return res.json({
      sessionId: activeSession.id,
      startedAt: activeSession.startedAt ?? new Date(),
      submitted: false,
      resumed: true
    });
  }

  // Create a new session for the new attempt
  const session = await prisma.examSession.create({
    data: {
      applicationId: application.id,
      examId: snapshot.exam.id,
      startedAt: new Date(),
      status: "STARTED"
    }
  });

  res.status(201).json({
    sessionId: session.id,
    startedAt: session.startedAt ?? new Date(),
    submitted: false
  });
});

questionRoutes.post("/online/submit", authenticate, async (req: AuthRequest, res) => {
  if (!req.user) throw new AppError(401, "Authentication required");

  const candidateIds = await getCandidateIds(req.user);
  if (candidateIds.length === 0) throw new AppError(404, "Candidate profile not found");

  let examId = String(req.body.examId || "").trim();
  if (!examId) {
    const latestApp = await prisma.application.findFirst({
      where: { candidateId: { in: candidateIds } },
      orderBy: { submittedAt: "desc" },
      select: { examinationId: true }
    });
    if (latestApp) {
      examId = latestApp.examinationId;
    }
  }

  const snapshot = await getCandidatePhaseSnapshot(examId || undefined);
  if (!snapshot.access.onlineExam) throw new AppError(400, "Online examination is not active");

  const application = await prisma.application.findFirst({
    where: { candidateId: { in: candidateIds }, examinationId: snapshot.exam.id, status: { in: ["APPROVED", "PENDING"] } },
    orderBy: { submittedAt: "desc" }
  });
  if (!application) throw new AppError(404, "No application found for this examination");

  const answers = req.body.answers && typeof req.body.answers === "object" ? req.body.answers as Record<string, string> : {};
  const marked = Array.isArray(req.body.marked) ? req.body.marked.map(String) : [];

  const session = await prisma.examSession.findFirst({
    where: { applicationId: application.id, examId: snapshot.exam.id, status: "STARTED" },
    orderBy: { startedAt: "desc" }
  });

  if (!session) {
    throw new AppError(400, "No active exam session found to submit.");
  }

  // Save the responses
  await prisma.candidateResponse.deleteMany({ where: { sessionId: session.id } });
  for (const [questionId, optionId] of Object.entries(answers)) {
    await prisma.candidateResponse.create({
      data: {
        sessionId: session.id,
        questionId,
        answer: { optionId },
        marked: marked.includes(questionId)
      }
    });
  }

  // Update session status
  await prisma.examSession.update({
    where: { id: session.id },
    data: {
      submittedAt: new Date(),
      status: "SUBMITTED"
    }
  });

  // Evaluate the answers
  const questions = await prisma.question.findMany({
    where: { bank: { examId: snapshot.exam.id } },
    include: { options: true }
  });

  let score = 0;
  for (const question of questions) {
    const selectedOptionId = answers[question.id];
    if (selectedOptionId) {
      const option = question.options.find((o) => o.id === selectedOptionId);
      if (option?.isCorrect) {
        score += question.marks;
      } else if (snapshot.exam.negativeMarkingEnabled) {
        const penalty = question.negativeMarks || snapshot.exam.negativeMarks || 0;
        score -= Math.abs(penalty);
      }
    }
  }
  score = Math.max(0, score);

  const totalMarks = snapshot.exam.totalMarks || questions.reduce((acc, q) => acc + q.marks, 0) || 100;
  const percentage = (score / totalMarks) * 100;
  const resultStatus = score >= (snapshot.exam.passingMarks || 40) ? "PASS" : "FAIL";

  const attemptCount = await prisma.examAttempt.count({
    where: { studentId: application.candidateId, examId: snapshot.exam.id }
  });
  const attemptNumber = attemptCount + 1;
  const timeTaken = Math.floor((new Date().getTime() - (session.startedAt || new Date()).getTime()) / 1000);

  // Save Attempt
  const attempt = await prisma.examAttempt.create({
    data: {
      attemptNumber,
      studentId: application.candidateId,
      examId: snapshot.exam.id,
      answers: answers as any,
      submittedAt: new Date(),
      timeTaken,
      score,
      percentage,
      resultStatus,
      evaluationStatus: "EVALUATED",
      published: false
    }
  });

  // Recalculate ranks for this exam
  await recalculateAttemptsRanks(snapshot.exam.id);

  // Add history log
  await prisma.applicationHistory.create({
    data: {
      applicationId: application.id,
      status: `EXAM_ATTEMPT_${attemptNumber}`,
      remarks: `Attempt ${attemptNumber} submitted and evaluated. Score: ${score}`
    }
  });

  // Get the rank
  const updatedAttempt = await prisma.examAttempt.findUniqueOrThrow({
    where: { id: attempt.id }
  });

  const existingResult = await prisma.result.findUnique({
    where: { applicationId: application.id }
  });

  if (!existingResult) {
    await prisma.result.create({
      data: {
        applicationId: application.id,
        examId: snapshot.exam.id,
        marks: score,
        percentage,
        rank: updatedAttempt.rank || 0,
        percentile: percentage,
        qualified: resultStatus === "PASS",
        status: "DRAFT"
      }
    });
  }

  res.status(201).json({
    sessionId: session.id,
    submitted: true,
    attemptNumber,
    score,
    percentage,
    answered: Object.keys(answers).length
  });
});

async function recalculateAttemptsRanks(examId: string) {
  const attempts = await prisma.examAttempt.findMany({
    where: { examId },
    orderBy: [
      { score: "desc" },
      { percentage: "desc" }
    ]
  });

  const studentLatestAttempts = new Map<string, any>();
  for (const attempt of attempts) {
    if (!studentLatestAttempts.has(attempt.studentId)) {
      studentLatestAttempts.set(attempt.studentId, attempt);
    }
  }

  const rankedAttempts = Array.from(studentLatestAttempts.values())
    .sort((a, b) => b.score - a.score || b.percentage - a.percentage);

  for (const [index, attempt] of rankedAttempts.entries()) {
    await prisma.examAttempt.update({
      where: { id: attempt.id },
      data: { rank: index + 1 }
    });
  }
}

