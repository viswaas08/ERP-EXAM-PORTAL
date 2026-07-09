import { Router } from "express";
import { prisma } from "../config/prisma.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { streamPortalPdf } from "../services/pdf.service.js";

export const resultRoutes = Router();

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

resultRoutes.get("/", authenticate, async (req, res) => {
  const examId = String(req.query.examId || "");
  const results = await prisma.result.findMany({
    where: { examId: examId || undefined },
    include: { application: { include: { candidate: { include: { user: true } }, examination: true } }, exam: true },
    orderBy: [{ rank: "asc" }, { marks: "desc" }]
  });
  res.json(results);
});

resultRoutes.post("/evaluate", authenticate, authorize("result:publish"), async (req, res) => {
  const evaluated = await evaluateApplications(String(req.body.examId || "") || undefined);
  res.status(201).json({ evaluated: evaluated.length });
});

resultRoutes.post("/publish", authenticate, authorize("result:publish"), async (req, res) => {
  const examId = String(req.body.examId || "");
  const updated = await prisma.result.updateMany({
    where: { examId: examId || undefined },
    data: { status: "PUBLISHED" }
  });
  res.json({ published: updated.count });
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
