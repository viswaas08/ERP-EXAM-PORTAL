import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const passwordHash = await bcrypt.hash("Password@123", 10);

const tamilNaduExamCities = [
  { city: "Chennai", district: "Chennai" },
  { city: "Coimbatore", district: "Coimbatore" },
  { city: "Madurai", district: "Madurai" },
  { city: "Tiruchirappalli", district: "Tiruchirappalli" },
  { city: "Salem", district: "Salem" },
  { city: "Tirunelveli", district: "Tirunelveli" },
  { city: "Erode", district: "Erode" },
  { city: "Vellore", district: "Vellore" },
  { city: "Thanjavur", district: "Thanjavur" },
  { city: "Thoothukudi", district: "Thoothukudi" },
  { city: "Dindigul", district: "Dindigul" },
  { city: "Nagercoil", district: "Kanniyakumari" }
];

async function main() {
  await prisma.auditLog.deleteMany();
  await prisma.candidateResponse.deleteMany();
  await prisma.examSession.deleteMany();
  await prisma.result.deleteMany();
  await prisma.hallTicket.deleteMany();
  await prisma.questionOption.deleteMany();
  await prisma.question.deleteMany();
  await prisma.questionBank.deleteMany();
  await prisma.topic.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.applicationDocument.deleteMany();
  await prisma.applicationHistory.deleteMany();
  await prisma.dynamicFormResponse.deleteMany();
  await prisma.application.deleteMany();
  await prisma.candidateProfile.deleteMany();
  await prisma.candidate.deleteMany();
  await prisma.user.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.eligibilityCondition.deleteMany();
  await prisma.eligibilityRule.deleteMany();
  await prisma.dynamicFormField.deleteMany();
  await prisma.dynamicFormSection.deleteMany();
  await prisma.dynamicFormTemplate.deleteMany();
  await prisma.workflowPhase.deleteMany();
  await prisma.examCentre.deleteMany();
  await prisma.examination.deleteMany();
  await prisma.systemSetting.deleteMany();

  const roles = [
    {
      name: "Super Admin",
      permissions: ["exam:create", "application:review", "rule:execute", "result:publish", "settings:update", "hall-ticket:generate"]
    },
    { name: "Examination Controller", permissions: ["controller:exam:manage", "hall-ticket:generate"] },
    { name: "Document Verifier", permissions: ["verifier:document:review"] },
    { name: "Question Paper Setter", permissions: ["setter:question:manage"] },
    { name: "Result Officer", permissions: ["officer:result:publish"] },
    { name: "Read Only Auditor", permissions: ["auditor:read"] },
    { name: "Candidate", permissions: ["candidate:self"] }
  ];

  const roleRecords = new Map<string, string>();
  for (const role of roles) {
    const created = await prisma.role.create({
      data: {
        name: role.name,
        permissions: {
          create: role.permissions.map((code) => ({ code, label: code }))
        }
      }
    });
    roleRecords.set(role.name, created.id);
  }

  await prisma.user.create({
    data: {
      name: "Super Admin",
      email: "admin@exam.gov",
      passwordHash,
      roleId: roleRecords.get("Super Admin")!
    }
  });

  await prisma.systemSetting.createMany({
    data: [
      { key: "organizationName", value: "National Examination Authority" },
      { key: "portalName", value: "Centralized Competitive Examination Portal" },
      { key: "passwordPolicy", value: { minLength: 8, uppercase: true, number: true, symbol: true } },
      { key: "uploadLimitMb", value: 10 },
      { key: "sessionTimeoutMinutes", value: 30 },
      { key: "examCityOptions", value: tamilNaduExamCities.map((item) => ({ ...item, state: "Tamil Nadu" })) },
      { key: "seedProfile", value: { mode: "production-clean", seededUsers: ["admin@exam.gov"], seededCandidates: 0, seededApplications: 0 } }
    ]
  });
}

main().finally(async () => prisma.$disconnect());
