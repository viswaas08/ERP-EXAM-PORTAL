import { Router } from "express";
import { prisma } from "../config/prisma.js";
import { authenticate, type AuthRequest } from "../middleware/auth.js";
import { getCandidatePhaseSnapshot } from "../services/exam.service.js";
import { AppError } from "../utils/AppError.js";

export const candidateRoutes = Router();

async function ensureCandidate(userId: string) {
  return prisma.candidate.upsert({
    where: { userId },
    create: { userId },
    update: {}
  });
}

async function resolveExam(examName?: string) {
  const exam = await prisma.examination.findFirst({
    where: examName
      ? { OR: [{ name: { contains: examName, mode: "insensitive" } }, { code: { contains: examName, mode: "insensitive" } }] }
      : { status: { in: ["OPEN", "ACTIVE"] } },
    include: { workflowPhases: true },
    orderBy: { createdAt: "desc" }
  });

  if (!exam) throw new AppError(404, "No examination available for registration");
  return exam;
}

candidateRoutes.get("/dashboard", authenticate, async (req: AuthRequest, res) => {
  if (!req.user) throw new AppError(401, "Authentication required");
  const candidate = await ensureCandidate(req.user.id);
  const application = await prisma.application.findFirst({
    where: { candidateId: candidate.id },
    include: {
      examination: true,
      documents: true,
      history: { orderBy: { createdAt: "asc" } },
      hallTicket: { include: { centre: true } },
      result: true
    },
    orderBy: { submittedAt: "desc" }
  });

  const phase = await getCandidatePhaseSnapshot(application?.examinationId);
  const profile = await prisma.candidateProfile.findUnique({ where: { candidateId: candidate.id } });

  res.json({ profile, application, phase });
});

candidateRoutes.post("/registration", authenticate, async (req: AuthRequest, res) => {
  if (!req.user) throw new AppError(401, "Authentication required");
  const candidate = await ensureCandidate(req.user.id);
  const exam = await resolveExam(req.body.exam);
  const applicationNo = `APP-${new Date().getFullYear()}-${candidate.id.slice(-6).toUpperCase()}`;
  const percentage = Number(req.body.percentage || 0);

  await prisma.candidateProfile.upsert({
    where: { candidateId: candidate.id },
    create: {
      candidateId: candidate.id,
      phone: String(req.body.phone || ""),
      dateOfBirth: req.body.dateOfBirth ? new Date(req.body.dateOfBirth) : new Date("2000-01-01"),
      nationality: String(req.body.nationality || "Indian"),
      category: String(req.body.category || "General"),
      qualification: String(req.body.qualification || "Bachelor's Degree"),
      percentage,
      state: String(req.body.state || "Maharashtra"),
      district: String(req.body.district || "Pune"),
      address: String(req.body.address || "Candidate address")
    },
    update: {
      phone: String(req.body.phone || ""),
      dateOfBirth: req.body.dateOfBirth ? new Date(req.body.dateOfBirth) : new Date("2000-01-01"),
      nationality: String(req.body.nationality || "Indian"),
      category: String(req.body.category || "General"),
      qualification: String(req.body.qualification || "Bachelor's Degree"),
      percentage,
      state: String(req.body.state || "Maharashtra"),
      district: String(req.body.district || "Pune"),
      address: String(req.body.address || "Candidate address")
    }
  });

  const existing = await prisma.application.findFirst({
    where: { candidateId: candidate.id, examinationId: exam.id }
  });

  const application = existing
    ? await prisma.application.update({
        where: { id: existing.id },
        data: {
          status: "PENDING",
          history: { create: { status: "UPDATED", remarks: "Candidate registration updated" } }
        }
      })
    : await prisma.application.create({
        data: {
          applicationNo,
          candidateId: candidate.id,
          examinationId: exam.id,
          status: "PENDING",
          history: { create: { status: "SUBMITTED", remarks: "Candidate registration submitted" } }
        }
      });

  const docs = Array.isArray(req.body.documents) ? req.body.documents : [];
  await prisma.applicationDocument.deleteMany({ where: { applicationId: application.id } });
  for (const doc of docs) {
    await prisma.applicationDocument.create({
      data: {
        applicationId: application.id,
        type: String(doc).toUpperCase().replaceAll(" ", "_"),
        url: `cloudinary://pending/${application.applicationNo}/${String(doc).toLowerCase().replaceAll(" ", "-")}`,
        status: "PENDING"
      }
    });
  }

  await prisma.auditLog.create({
    data: {
      userEmail: req.user.id,
      role: "Candidate",
      action: existing ? "CANDIDATE_APPLICATION_UPDATE" : "CANDIDATE_APPLICATION_SUBMIT",
      affectedRecord: application.id,
      newValue: JSON.stringify({ applicationNo: application.applicationNo, exam: exam.code })
    }
  }).catch(() => undefined);

  const fullApplication = await prisma.application.findUnique({
    where: { id: application.id },
    include: { examination: true, documents: true, history: true }
  });

  res.status(existing ? 200 : 201).json(fullApplication);
});
