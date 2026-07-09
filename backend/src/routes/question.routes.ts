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
  const questions = await prisma.question.findMany({
    include: {
      subject: true,
      topic: true,
      bank: { include: { exam: true } },
      options: true
    }
  });

  res.json(questions.sort((a, b) => questionNumber(a.tags) - questionNumber(b.tags)));
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

  const session = await prisma.examSession.create({
    data: {
      applicationId: application.id,
      examId: snapshot.exam.id,
      startedAt: new Date(),
      submittedAt: new Date(),
      status: "SUBMITTED"
    }
  });

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

  res.status(201).json({ sessionId: session.id, submitted: true, answered: Object.keys(answers).length });
});
