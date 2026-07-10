import { Router, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
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

async function getCandidateRoleId() {
  const role = await prisma.role.findUnique({ where: { name: "Candidate" } });
  if (!role) throw new AppError(500, "Candidate role is not configured");
  return role.id;
}

async function resolveExam(examInput?: string) {
  const input = String(examInput || "").trim();
  const exam = await prisma.examination.findFirst({
    where: input
      ? {
          status: { in: ["OPEN", "ACTIVE", "PUBLISHED", "ONLINE"] },
          OR: [
            { id: input },
            { name: { contains: input, mode: "insensitive" } },
            { code: { contains: input, mode: "insensitive" } }
          ]
        }
      : { status: { in: ["OPEN", "ACTIVE", "PUBLISHED", "ONLINE"] } },
    include: { workflowPhases: true },
    orderBy: { createdAt: "desc" }
  });

  if (!exam) throw new AppError(404, "No examination available for registration");
  return exam;
}

function applicationNumber(candidateId: string, examCode: string) {
  const code = examCode.replace(/[^A-Z0-9]/gi, "").slice(0, 8).toUpperCase() || "EXAM";
  return `APP-${new Date().getFullYear()}-${code}-${candidateId.slice(-6).toUpperCase()}`;
}

async function ensureExamCentres(examId: string) {
  const existing = await prisma.examCentre.findMany({ where: { examId }, orderBy: [{ city: "asc" }, { name: "asc" }] });
  if (existing.length) return existing;

  const setting = await prisma.systemSetting.findUnique({ where: { key: "examCityOptions" } });
  const cities = Array.isArray(setting?.value)
    ? setting.value as Array<{ city: string; district: string; state: string }>
    : [{ city: "Chennai", district: "Chennai", state: "Tamil Nadu" }];

  await prisma.examCentre.createMany({
    data: cities.map((item, index) => ({
      examId,
      name: `${item.city} Government Examination Centre`,
      city: item.city,
      district: item.district,
      state: item.state,
      capacity: 300,
      availableSystems: 280,
      gpsLatitude: 8.8 + index * 0.45,
      gpsLongitude: 76.9 + index * 0.35
    }))
  });

  return prisma.examCentre.findMany({ where: { examId }, orderBy: [{ city: "asc" }, { name: "asc" }] });
}

async function ensureCandidateHallTicket(application: {
  id: string;
  applicationNo: string;
  examinationId: string;
  status: string;
  examination: { code: string };
  hallTicket?: { id: string } | null;
}) {
  if (application.hallTicket || application.status !== "APPROVED") return;

  const snapshot = await getCandidatePhaseSnapshot(application.examinationId);
  if (!snapshot.access.hallTicket && !snapshot.access.archiveDownloads) return;

  const centres = await ensureExamCentres(application.examinationId);
  const centre = centres[0];
  if (!centre) return;

  const codePrefix = application.examination.code.replace(/[^A-Z0-9]/gi, "").slice(0, 6).toUpperCase() || "EXAM";
  const rollNumber = `${codePrefix}${application.id.slice(-8).toUpperCase()}`;
  await prisma.hallTicket.create({
    data: {
      applicationId: application.id,
      examId: application.examinationId,
      centreId: centre.id,
      rollNumber,
      seatNumber: `${centre.city.slice(0, 3).toUpperCase()}-0001`,
      qrCode: `QR:${application.applicationNo}:${rollNumber}`,
      barcode: `BAR:${application.applicationNo}:${rollNumber}`,
      reportingTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }
  }).catch(() => undefined);
}

candidateRoutes.get("/dashboard", authenticate, async (req: AuthRequest, res) => {
  if (!req.user) throw new AppError(401, "Authentication required");
  const candidate = await ensureCandidate(req.user.id);
  let applications = await prisma.application.findMany({
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

  for (const application of applications) {
    await ensureCandidateHallTicket(application);
  }

  applications = await prisma.application.findMany({
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
  const application = applications[0] ?? null;

  const phase = await getCandidatePhaseSnapshot(application?.examinationId);
  const profile = await prisma.candidateProfile.findUnique({ where: { candidateId: candidate.id } });
  const attempts = await prisma.examAttempt.findMany({
    where: { studentId: candidate.id },
    orderBy: { attemptNumber: "desc" }
  });

  res.json({ profile, application, applications, phase, attempts });
});

candidateRoutes.post("/registration", authenticate, async (req: AuthRequest, res) => {
  if (!req.user) throw new AppError(401, "Authentication required");
  const candidate = await ensureCandidate(req.user.id);
  const exam = await resolveExam(req.body.exam);
  const applicationNo = applicationNumber(candidate.id, exam.code);
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

async function publicRegistrationHandler(req: Request, res: Response) {
  const email = String(req.body.email || "").toLowerCase();
  const password = String(req.body.password || "");
  if (!email || !password || password.length < 8) {
    throw new AppError(400, "Candidate email and password with at least 8 characters are required");
  }

  const roleId = await getCandidateRoleId();
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.upsert({
    where: { email },
    create: {
      name: String(req.body.name || "Candidate"),
      email,
      passwordHash,
      roleId
    },
    update: {
      name: String(req.body.name || "Candidate"),
      passwordHash
    }
  });

  const candidate = await ensureCandidate(user.id);
  const exam = await resolveExam(req.body.exam);
  const applicationNo = applicationNumber(candidate.id, exam.code);
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
      state: String(req.body.state || "Tamil Nadu"),
      district: String(req.body.district || "Chennai"),
      address: String(req.body.address || "Candidate address")
    },
    update: {
      phone: String(req.body.phone || ""),
      dateOfBirth: req.body.dateOfBirth ? new Date(req.body.dateOfBirth) : new Date("2000-01-01"),
      nationality: String(req.body.nationality || "Indian"),
      category: String(req.body.category || "General"),
      qualification: String(req.body.qualification || "Bachelor's Degree"),
      percentage,
      state: String(req.body.state || "Tamil Nadu"),
      district: String(req.body.district || "Chennai"),
      address: String(req.body.address || "Candidate address")
    }
  });

  const existing = await prisma.application.findFirst({ where: { candidateId: candidate.id, examinationId: exam.id } });
  const application = existing
    ? await prisma.application.update({
        where: { id: existing.id },
        data: { status: "PENDING", history: { create: { status: "UPDATED", remarks: "Public candidate registration updated" } } }
      })
    : await prisma.application.create({
        data: {
          applicationNo,
          candidateId: candidate.id,
          examinationId: exam.id,
          status: "PENDING",
          history: { create: { status: "SUBMITTED", remarks: "Public candidate registration submitted" } }
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

  res.status(existing ? 200 : 201).json({
    ...(await prisma.application.findUnique({ where: { id: application.id }, include: { examination: true, documents: true, history: true } })),
    candidateLogin: { email }
  });
}

candidateRoutes.post("/public-registration", publicRegistrationHandler);
candidateRoutes.post("/public-register", publicRegistrationHandler);
