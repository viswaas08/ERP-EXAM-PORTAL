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
  });

  res.status(201).json(imported);
});

questionRoutes.get("/online/active", async (_req, res) => {
  const snapshot = await getCandidatePhaseSnapshot();
  const questions = await prisma.question.findMany({
    where: { bank: { examId: snapshot.exam.id } },
    include: {
      subject: true,
      topic: true,
      options: { select: { id: true, text: true } }
    }
  });

  res.json({
    exam: snapshot.exam,
    activePhase: snapshot.activePhase,
    access: snapshot.access,
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
  const snapshot = await getCandidatePhaseSnapshot(String(req.body.examId || "") || undefined);
  if (!snapshot.access.onlineExam) throw new AppError(400, "Online examination is not active");

  const candidate = await prisma.candidate.findUnique({ where: { userId: req.user.id } });
  if (!candidate) throw new AppError(404, "Candidate profile not found");

  const application = await prisma.application.findFirst({
    where: { candidateId: candidate.id, examinationId: snapshot.exam.id, status: { in: ["APPROVED", "PENDING"] } },
    orderBy: { submittedAt: "desc" }
  });
  if (!application) throw new AppError(404, "No application found for this examination");

  const existing = await prisma.examSession.findFirst({
    where: { applicationId: application.id, examId: snapshot.exam.id },
    orderBy: { startedAt: "desc" }
  });

  if (existing?.status === "SUBMITTED") {
    return res.json({ sessionId: existing.id, startedAt: existing.startedAt, submittedAt: existing.submittedAt, submitted: true });
  }

  const session = existing ?? await prisma.examSession.create({
    data: {
      applicationId: application.id,
      examId: snapshot.exam.id,
      startedAt: new Date(),
      status: "STARTED"
    }
  });

  if (existing && existing.status !== "SUBMITTED") {
    await prisma.examSession.update({
      where: { id: existing.id },
      data: { status: "STARTED", startedAt: existing.startedAt ?? new Date() }
    });
  }

  res.status(existing ? 200 : 201).json({
    sessionId: session.id,
    startedAt: session.startedAt ?? new Date(),
    submitted: false
  });
});

questionRoutes.post("/online/submit", authenticate, async (req: AuthRequest, res) => {
  if (!req.user) throw new AppError(401, "Authentication required");
  const snapshot = await getCandidatePhaseSnapshot(String(req.body.examId || "") || undefined);
  if (!snapshot.access.onlineExam) throw new AppError(400, "Online examination is not active");

  const candidate = await prisma.candidate.findUnique({ where: { userId: req.user.id } });
  if (!candidate) throw new AppError(404, "Candidate profile not found");

  const application = await prisma.application.findFirst({
    where: { candidateId: candidate.id, examinationId: snapshot.exam.id, status: { in: ["APPROVED", "PENDING"] } },
    orderBy: { submittedAt: "desc" }
  });
  if (!application) throw new AppError(404, "No application found for this examination");

  const answers = req.body.answers && typeof req.body.answers === "object" ? req.body.answers as Record<string, string> : {};
  const marked = Array.isArray(req.body.marked) ? req.body.marked.map(String) : [];

  const existing = await prisma.examSession.findFirst({
    where: { applicationId: application.id, examId: snapshot.exam.id },
    orderBy: { startedAt: "desc" }
  });

  const session = existing?.status === "SUBMITTED"
    ? existing
    : existing ?? await prisma.examSession.create({
        data: {
          applicationId: application.id,
          examId: snapshot.exam.id,
          startedAt: new Date(),
          status: "STARTED"
        }
      });

  if (existing?.status !== "SUBMITTED") {
    await prisma.candidateResponse.deleteMany({ where: { sessionId: session.id } });
    await prisma.examSession.update({
      where: { id: session.id },
      data: {
        submittedAt: new Date(),
        status: "SUBMITTED"
      }
    });
  }

  if (existing?.status !== "SUBMITTED") {
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

    await prisma.applicationHistory.create({
      data: {
        applicationId: application.id,
        status: "EXAM_SUBMITTED",
        remarks: `Online examination submitted with ${Object.keys(answers).length} answer(s)`
      }
    });
  }

  res.status(existing?.status === "SUBMITTED" ? 200 : 201).json({ sessionId: session.id, submitted: true, answered: existing?.status === "SUBMITTED" ? existing.responses.length : Object.keys(answers).length });
});
