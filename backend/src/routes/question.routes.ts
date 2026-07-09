import { Router } from "express";
import { prisma } from "../config/prisma.js";
import { authenticate } from "../middleware/auth.js";
import { getCandidatePhaseSnapshot } from "../services/exam.service.js";

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
