import { faker } from "@faker-js/faker";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const passwordHash = await bcrypt.hash("Password@123", 10);
const states = ["Maharashtra", "Karnataka", "Delhi", "Tamil Nadu", "Rajasthan", "Kerala", "Gujarat"];
const qualifications = ["Bachelor's Degree", "Master's Degree", "Diploma", "B.Tech", "B.Sc"];
const statuses = ["PENDING", "APPROVED", "REJECTED", "RETURNED", "HOLD"];

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

  const superAdmin = await prisma.role.create({
    data: {
      name: "Super Admin",
      permissions: {
        create: ["exam:create", "application:review", "rule:execute", "result:publish", "settings:update"].map((code) => ({ code, label: code }))
      }
    }
  });
  const controller = await prisma.role.create({ data: { name: "Examination Controller", permissions: { create: [{ code: "controller:exam:manage", label: "Manage exams" }] } } });
  const verifier = await prisma.role.create({ data: { name: "Document Verifier", permissions: { create: [{ code: "verifier:document:review", label: "Review documents" }] } } });
  const setter = await prisma.role.create({ data: { name: "Question Paper Setter", permissions: { create: [{ code: "setter:question:manage", label: "Manage questions" }] } } });
  const resultOfficer = await prisma.role.create({ data: { name: "Result Officer", permissions: { create: [{ code: "officer:result:publish", label: "Publish results" }] } } });
  const auditor = await prisma.role.create({ data: { name: "Read Only Auditor", permissions: { create: [{ code: "auditor:read", label: "Read only" }] } } });
  const candidateRole = await prisma.role.create({ data: { name: "Candidate", permissions: { create: [{ code: "candidate:self", label: "Candidate self service" }] } } });

  await prisma.user.createMany({
    data: [
      { name: "Super Admin", email: "admin@exam.gov", passwordHash, roleId: superAdmin.id },
      { name: "Exam Controller", email: "controller@exam.gov", passwordHash, roleId: controller.id },
      { name: "Document Verifier", email: "verifier@exam.gov", passwordHash, roleId: verifier.id },
      { name: "Question Setter", email: "setter@exam.gov", passwordHash, roleId: setter.id },
      { name: "Result Officer", email: "result@exam.gov", passwordHash, roleId: resultOfficer.id },
      { name: "Demo Candidate", email: "candidate@exam.gov", passwordHash, roleId: candidateRole.id }
    ]
  });

  for (let i = 0; i < 50; i++) {
    await prisma.user.create({ data: { name: faker.person.fullName(), email: faker.internet.email().toLowerCase(), passwordHash, roleId: [controller.id, verifier.id, setter.id, resultOfficer.id, auditor.id][i % 5] } });
  }

  const exams = [];
  for (let i = 0; i < 10; i++) {
    const exam = await prisma.examination.create({
      data: {
        name: `${faker.company.buzzNoun()} Competitive Examination ${2026 + (i % 2)}`,
        code: `EXAM-${2026}-${String(i + 1).padStart(2, "0")}`,
        description: faker.lorem.sentence(),
        department: faker.company.name(),
        durationMinutes: 120 + (i % 3) * 30,
        maximumMarks: 200,
        passingMarks: 80,
        negativeMarking: i % 2 === 0,
        languages: ["English", "Hindi"],
        maximumAttempts: 3,
        status: i % 3 === 0 ? "OPEN" : "ACTIVE",
        workflowPhases: {
          create: ["Registration", "Correction Window", "Verification", "Hall Ticket Release", "Online Examination", "Result Publication"].map((name, j) => ({
            name,
            status: j < 3 ? "OPEN" : "SCHEDULED",
            opensAt: faker.date.future(),
            closesAt: faker.date.future()
          }))
        }
      }
    });
    exams.push(exam);

    const template = await prisma.dynamicFormTemplate.create({ data: { examId: exam.id, name: "Default Registration Form" } });
    for (const [order, title] of ["Personal Details", "Education", "Documents"].entries()) {
      const section = await prisma.dynamicFormSection.create({ data: { templateId: template.id, title, order } });
      for (const [displayOrder, label] of ["Full Name", "Email", "Qualification", "Percentage", "Photo", "Signature"].entries()) {
        await prisma.dynamicFormField.create({ data: { sectionId: section.id, label, fieldType: label.includes("Photo") || label.includes("Signature") ? "IMAGE_UPLOAD" : "TEXT", required: true, eligibilityField: ["Qualification", "Percentage"].includes(label), displayOrder } });
      }
    }
  }

  for (let i = 0; i < 30; i++) {
    await prisma.examCentre.create({
      data: {
        examId: exams[i % exams.length].id,
        name: `${faker.location.city()} Digital Examination Centre`,
        city: faker.location.city(),
        district: faker.location.county(),
        state: states[i % states.length],
        capacity: faker.number.int({ min: 180, max: 600 }),
        availableSystems: faker.number.int({ min: 150, max: 580 }),
        gpsLatitude: Number(faker.location.latitude()),
        gpsLongitude: Number(faker.location.longitude())
      }
    });
  }
  const centres = await prisma.examCentre.findMany();

  // Candidate and application lists are intentionally not bulk-seeded.
  // The demo candidate login remains available, but the ERP starts with an empty applicant register.

  for (let i = 0; i < 30; i++) {
    await prisma.eligibilityRule.create({
      data: {
        examId: exams[i % exams.length].id,
        name: `Eligibility Rule ${i + 1}`,
        priority: i + 1,
        action: i % 3 === 0 ? "APPROVE_AUTOMATICALLY" : "MANUAL_VERIFICATION",
        conditions: { create: [{ field: "Percentage", operator: ">=", value: "60" }, { field: "Nationality", operator: "=", value: "Indian", connector: "AND" }] }
      }
    });
  }

  const subjects = [];
  for (const name of ["General Studies", "Mathematics", "Reasoning", "English", "Computer Awareness"]) {
    subjects.push(await prisma.subject.create({ data: { name } }));
  }
  const topics = [];
  for (const subject of subjects) {
    for (let i = 0; i < 4; i++) topics.push(await prisma.topic.create({ data: { subjectId: subject.id, name: `${subject.name} Topic ${i + 1}` } }));
  }
  const banks = [];
  for (const exam of exams) banks.push(await prisma.questionBank.create({ data: { examId: exam.id, name: `${exam.code} Main Bank` } }));

  for (let i = 0; i < 6000; i++) {
    const subject = subjects[i % subjects.length];
    const topic = topics[i % topics.length];
    await prisma.question.create({
      data: {
        bankId: banks[i % banks.length].id,
        subjectId: subject.id,
        topicId: topic.id,
        questionType: ["MCQ", "MULTIPLE_SELECT", "NUMERICAL", "TRUE_FALSE", "IMAGE"][i % 5],
        prompt: faker.lorem.sentence(),
        difficulty: ["Easy", "Medium", "Hard"][i % 3],
        explanation: faker.lorem.sentence(),
        marks: 2,
        negativeMarks: 0.5,
        tags: ["recruitment", subject.name],
        options: { create: ["Option A", "Option B", "Option C", "Option D"].map((text, j) => ({ text, isCorrect: j === i % 4 })) }
      }
    });
  }

  // Hall tickets and results are generated only after real applications exist.

  for (let i = 0; i < 100; i++) {
    await prisma.notification.create({ data: { examId: exams[i % exams.length].id, title: faker.company.catchPhrase(), body: faker.lorem.paragraph(), type: ["BANNER", "POPUP", "NOTICE"][i % 3], publishAt: faker.date.recent() } });
  }

  for (let i = 0; i < 5000; i++) {
    await prisma.auditLog.create({ data: { userEmail: `staff${i % 50}@exam.gov`, role: ["Super Admin", "Document Verifier", "Result Officer"][i % 3], action: ["CREATE", "UPDATE", "APPROVE", "REJECT", "EXPORT"][i % 5], affectedRecord: `REC-${i}`, oldValue: "{}", newValue: "{}", ipAddress: `10.0.0.${i % 255}` } });
  }

  await prisma.systemSetting.createMany({
    data: [
      { key: "organizationName", value: "National Examination Authority" },
      { key: "portalName", value: "Centralized Competitive Examination Portal" },
      { key: "passwordPolicy", value: { minLength: 8, uppercase: true, number: true, symbol: true } },
      { key: "uploadLimitMb", value: 10 },
      { key: "sessionTimeoutMinutes", value: 30 }
    ]
  });
}

main().finally(async () => prisma.$disconnect());
