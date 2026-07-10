import { Router } from "express";
import { prisma } from "../config/prisma.js";
import { authenticate, authorize, type AuthRequest } from "../middleware/auth.js";
import { streamPortalPdf } from "../services/pdf.service.js";
import { AppError } from "../utils/AppError.js";

export const hallTicketRoutes = Router();

async function ensureTamilNaduCentres(examId: string) {
  const existing = await prisma.examCentre.findMany({ where: { examId }, orderBy: [{ city: "asc" }, { name: "asc" }] });
  if (existing.length) return existing;

  const setting = await prisma.systemSetting.findUnique({ where: { key: "examCityOptions" } });
  const cities = Array.isArray(setting?.value)
    ? setting.value as Array<{ city: string; district: string; state: string }>
    : [
        { city: "Ariyalur", district: "Ariyalur", state: "Tamil Nadu" },
        { city: "Chengalpattu", district: "Chengalpattu", state: "Tamil Nadu" },
        { city: "Chennai", district: "Chennai", state: "Tamil Nadu" },
        { city: "Coimbatore", district: "Coimbatore", state: "Tamil Nadu" },
        { city: "Cuddalore", district: "Cuddalore", state: "Tamil Nadu" },
        { city: "Dharmapuri", district: "Dharmapuri", state: "Tamil Nadu" },
        { city: "Dindigul", district: "Dindigul", state: "Tamil Nadu" },
        { city: "Erode", district: "Erode", state: "Tamil Nadu" },
        { city: "Kallakurichi", district: "Kallakurichi", state: "Tamil Nadu" },
        { city: "Kancheepuram", district: "Kancheepuram", state: "Tamil Nadu" },
        { city: "Nagercoil", district: "Kanniyakumari", state: "Tamil Nadu" },
        { city: "Karur", district: "Karur", state: "Tamil Nadu" },
        { city: "Krishnagiri", district: "Krishnagiri", state: "Tamil Nadu" },
        { city: "Madurai", district: "Madurai", state: "Tamil Nadu" },
        { city: "Mayiladuthurai", district: "Mayiladuthurai", state: "Tamil Nadu" },
        { city: "Nagapattinam", district: "Nagapattinam", state: "Tamil Nadu" },
        { city: "Namakkal", district: "Namakkal", state: "Tamil Nadu" },
        { city: "Udhagamandalam", district: "Nilgiris", state: "Tamil Nadu" },
        { city: "Perambalur", district: "Perambalur", state: "Tamil Nadu" },
        { city: "Pudukkottai", district: "Pudukkottai", state: "Tamil Nadu" },
        { city: "Ramanathapuram", district: "Ramanathapuram", state: "Tamil Nadu" },
        { city: "Ranipet", district: "Ranipet", state: "Tamil Nadu" },
        { city: "Salem", district: "Salem", state: "Tamil Nadu" },
        { city: "Sivagangai", district: "Sivagangai", state: "Tamil Nadu" },
        { city: "Tenkasi", district: "Tenkasi", state: "Tamil Nadu" },
        { city: "Thanjavur", district: "Thanjavur", state: "Tamil Nadu" },
        { city: "Theni", district: "Theni", state: "Tamil Nadu" },
        { city: "Thoothukudi", district: "Thoothukudi", state: "Tamil Nadu" },
        { city: "Tiruchirappalli", district: "Tiruchirappalli", state: "Tamil Nadu" },
        { city: "Tirunelveli", district: "Tirunelveli", state: "Tamil Nadu" },
        { city: "Tirupathur", district: "Tirupathur", state: "Tamil Nadu" },
        { city: "Tiruppur", district: "Tiruppur", state: "Tamil Nadu" },
        { city: "Tiruvallur", district: "Tiruvallur", state: "Tamil Nadu" },
        { city: "Tiruvannamalai", district: "Tiruvannamalai", state: "Tamil Nadu" },
        { city: "Tiruvarur", district: "Tiruvarur", state: "Tamil Nadu" },
        { city: "Vellore", district: "Vellore", state: "Tamil Nadu" },
        { city: "Viluppuram", district: "Viluppuram", state: "Tamil Nadu" },
        { city: "Virudhunagar", district: "Virudhunagar", state: "Tamil Nadu" }
      ];

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

hallTicketRoutes.get("/", authenticate, async (req, res) => {
  const examId = req.query.examId as string | undefined;
  const tickets = await prisma.hallTicket.findMany({
    where: examId ? { examId } : undefined,
    include: {
      application: { include: { candidate: { include: { user: true } }, examination: true } },
      centre: true
    },
    orderBy: { rollNumber: "asc" }
  });

  res.json(tickets);
});

hallTicketRoutes.get("/:id.pdf", authenticate, async (req: AuthRequest, res) => {
  const ticketId = String(req.params.id);
  const ticket = await prisma.hallTicket.findUnique({
    where: { id: ticketId },
    include: {
      application: { include: { candidate: { include: { user: true } }, examination: true } },
      centre: true
    }
  });

  if (!ticket) throw new AppError(404, "Hall ticket not found");
  if (req.user?.role === "Candidate" && ticket.application.candidate.userId !== req.user.id) {
    throw new AppError(403, "Permission denied");
  }

  streamPortalPdf(res, "Hall Ticket", [
    `Application No: ${ticket.application.applicationNo}`,
    `Candidate: ${ticket.application.candidate.user.name}`,
    `Examination: ${ticket.application.examination.name} (${ticket.application.examination.code})`,
    `Roll Number: ${ticket.rollNumber}`,
    `Seat Number: ${ticket.seatNumber}`,
    `Centre: ${ticket.centre.name}`,
    `City: ${ticket.centre.city}, ${ticket.centre.state}`,
    `Reporting Time: ${ticket.reportingTime.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}`,
    `QR Code: ${ticket.qrCode}`,
    `Barcode: ${ticket.barcode}`
  ]);
});

hallTicketRoutes.post("/generate", authenticate, authorize("hall-ticket:generate", "controller:exam:manage"), async (req, res) => {
  const examId = String(req.body.examId || "");
  const where = examId ? { examinationId: examId, status: "APPROVED" } : { status: "APPROVED" };
  const applications = await prisma.application.findMany({
    where,
    include: { examination: true, hallTicket: true, candidate: { include: { user: true } } },
    orderBy: { submittedAt: "asc" }
  });

  const eligible = applications.filter((application) => !application.hallTicket);
  if (!eligible.length) {
    res.json({ generated: 0, message: "No approved applications pending hall ticket generation" });
    return;
  }

  const grouped = new Map<string, typeof eligible>();
  for (const application of eligible) {
    grouped.set(application.examinationId, [...(grouped.get(application.examinationId) ?? []), application]);
  }

  let generated = 0;
  for (const [currentExamId, apps] of grouped) {
    const centres = await ensureTamilNaduCentres(currentExamId);
    if (!centres.length) throw new AppError(400, "No centres available for hall ticket generation");

    for (const [index, application] of apps.entries()) {
      const centre = centres[index % centres.length];
      const codePrefix = application.examination.code.replace(/[^A-Z0-9]/gi, "").slice(0, 6).toUpperCase() || "EXAM";
      const rollNumber = `${codePrefix}${application.id.slice(-8).toUpperCase()}`;
      await prisma.hallTicket.create({
        data: {
          applicationId: application.id,
          examId: currentExamId,
          centreId: centre.id,
          rollNumber,
          seatNumber: `${centre.city.slice(0, 3).toUpperCase()}-${String(index + 1).padStart(4, "0")}`,
          qrCode: `QR:${application.applicationNo}:${rollNumber}`,
          barcode: `BAR:${application.applicationNo}:${rollNumber}`,
          reportingTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      });
      generated += 1;
    }
  }

  res.status(201).json({ generated });
});
