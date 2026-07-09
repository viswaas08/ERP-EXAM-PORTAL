import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { WORKFLOW_PHASE_NAMES } from "../src/services/exam.service.js";

const prisma = new PrismaClient();
const passwordHash = await bcrypt.hash("Password@123", 10);

const tamilNaduExamCities = [
  { city: "Ariyalur", district: "Ariyalur" },
  { city: "Chengalpattu", district: "Chengalpattu" },
  { city: "Chennai", district: "Chennai" },
  { city: "Coimbatore", district: "Coimbatore" },
  { city: "Cuddalore", district: "Cuddalore" },
  { city: "Dharmapuri", district: "Dharmapuri" },
  { city: "Dindigul", district: "Dindigul" },
  { city: "Erode", district: "Erode" },
  { city: "Kallakurichi", district: "Kallakurichi" },
  { city: "Kancheepuram", district: "Kancheepuram" },
  { city: "Nagercoil", district: "Kanniyakumari" },
  { city: "Karur", district: "Karur" },
  { city: "Krishnagiri", district: "Krishnagiri" },
  { city: "Madurai", district: "Madurai" },
  { city: "Mayiladuthurai", district: "Mayiladuthurai" },
  { city: "Nagapattinam", district: "Nagapattinam" },
  { city: "Namakkal", district: "Namakkal" },
  { city: "Udhagamandalam", district: "Nilgiris" },
  { city: "Perambalur", district: "Perambalur" },
  { city: "Pudukkottai", district: "Pudukkottai" },
  { city: "Ramanathapuram", district: "Ramanathapuram" },
  { city: "Ranipet", district: "Ranipet" },
  { city: "Salem", district: "Salem" },
  { city: "Sivagangai", district: "Sivagangai" },
  { city: "Tenkasi", district: "Tenkasi" },
  { city: "Thanjavur", district: "Thanjavur" },
  { city: "Theni", district: "Theni" },
  { city: "Thoothukudi", district: "Thoothukudi" },
  { city: "Tiruchirappalli", district: "Tiruchirappalli" },
  { city: "Tirunelveli", district: "Tirunelveli" },
  { city: "Tirupathur", district: "Tirupathur" },
  { city: "Tiruppur", district: "Tiruppur" },
  { city: "Tiruvallur", district: "Tiruvallur" },
  { city: "Tiruvannamalai", district: "Tiruvannamalai" },
  { city: "Tiruvarur", district: "Tiruvarur" },
  { city: "Vellore", district: "Vellore" },
  { city: "Viluppuram", district: "Viluppuram" },
  { city: "Virudhunagar", district: "Virudhunagar" }
];

const sectionBlueprints = [
  {
    subject: "English",
    topics: ["Grammar", "Vocabulary", "Reading Comprehension", "Sentence Correction", "Idioms"],
    prompt: (index: number) => `Choose the grammatically correct sentence for English question ${index}.`,
    options: (index: number) => [
      `The committee has approved proposal ${index}.`,
      `The committee have approve proposal ${index}.`,
      `The committee approving proposal ${index}.`,
      `The committee approvedly proposal ${index}.`
    ],
    explanation: (index: number) => `Question ${index} checks subject-verb agreement and standard sentence structure.`
  },
  {
    subject: "Maths",
    topics: ["Algebra", "Arithmetic", "Geometry", "Mensuration", "Data Interpretation"],
    prompt: (index: number) => `If x = ${index} and y = ${index + 4}, what is x + y?`,
    options: (index: number) => [String(index * 2 + 4), String(index + 4), String(index * 2), String(index * 2 + 6)],
    explanation: (index: number) => `Add ${index} and ${index + 4} to get ${index * 2 + 4}.`
  },
  {
    subject: "Chemistry",
    topics: ["Atomic Structure", "Periodic Table", "Chemical Bonding", "Acids and Bases", "Organic Chemistry"],
    prompt: (index: number) => `Which option best represents a stable chemical principle in chemistry question ${index}?`,
    options: (_index: number) => [
      "Noble gases generally have complete valence shells.",
      "Acids always have a pH greater than 7.",
      "Electrons are found only inside the nucleus.",
      "Ionic compounds never conduct electricity in solution."
    ],
    explanation: (index: number) => `Question ${index} tests the stable valence shell concept for noble gases.`
  },
  {
    subject: "Physics",
    topics: ["Mechanics", "Optics", "Electricity", "Thermodynamics", "Modern Physics"],
    prompt: (index: number) => `A body moves with constant velocity in physics question ${index}. What is its acceleration?`,
    options: (_index: number) => ["Zero", "Equal to velocity", "Always 9.8 m/s²", "Infinite"],
    explanation: (index: number) => `Question ${index} checks that constant velocity means no change in velocity, so acceleration is zero.`
  }
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
    { name: "Examination Controller", permissions: ["controller:exam:manage"] },
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

  const now = new Date();
  const examination = await prisma.examination.create({
    data: {
      name: "Integrated Science and Aptitude Entrance Examination",
      code: "ISA-2026",
      description: "Seeded operational examination paper with English, Maths, Chemistry, and Physics sections.",
      department: "Examination Authority",
      durationMinutes: 180,
      maximumMarks: 100,
      passingMarks: 40,
      negativeMarking: false,
      languages: ["English"],
      maximumAttempts: 1,
      status: "OPEN",
      workflowPhases: {
        create: WORKFLOW_PHASE_NAMES.map((name, index) => ({
          name,
          status: name === "Online Examination" ? "OPEN" : "SCHEDULED",
          opensAt: new Date(now.getTime() + (index - 5) * 24 * 60 * 60 * 1000),
          closesAt: new Date(now.getTime() + (index - 4) * 24 * 60 * 60 * 1000)
        }))
      },
      centres: {
        create: tamilNaduExamCities.map((item, index) => ({
          name: `${item.city} Government Examination Centre`,
          city: item.city,
          district: item.district,
          state: "Tamil Nadu",
          capacity: 300,
          availableSystems: 280,
          gpsLatitude: 8.8 + index * 0.45,
          gpsLongitude: 76.9 + index * 0.35
        }))
      }
    }
  });

  const questionBank = await prisma.questionBank.create({
    data: {
      examId: examination.id,
      name: "ISA-2026 Main Paper - 100 Questions"
    }
  });

  for (const blueprint of sectionBlueprints) {
    const subject = await prisma.subject.create({ data: { name: blueprint.subject } });
    const topics = [];
    for (const name of blueprint.topics) {
      topics.push(await prisma.topic.create({ data: { subjectId: subject.id, name } }));
    }

    for (let i = 1; i <= 25; i += 1) {
      const absoluteQuestionNumber = (sectionBlueprints.findIndex((item) => item.subject === blueprint.subject) * 25) + i;
      const topic = topics[(i - 1) % topics.length];
      const question = await prisma.question.create({
        data: {
          bankId: questionBank.id,
          subjectId: subject.id,
          topicId: topic.id,
          questionType: "MCQ",
          prompt: blueprint.prompt(i),
          difficulty: i <= 8 ? "Easy" : i <= 18 ? "Medium" : "Hard",
          explanation: blueprint.explanation(i),
          marks: 1,
          negativeMarks: 0,
          tags: [blueprint.subject, topic.name, "ISA-2026", `Q${absoluteQuestionNumber}`]
        }
      });

      const options = blueprint.options(i);
      for (const [optionIndex, text] of options.entries()) {
        await prisma.questionOption.create({
          data: {
            questionId: question.id,
            text,
            isCorrect: optionIndex === 0
          }
        });
      }
    }
  }

  await prisma.systemSetting.createMany({
    data: [
      { key: "organizationName", value: "National Examination Authority" },
      { key: "portalName", value: "Centralized Competitive Examination Portal" },
      { key: "passwordPolicy", value: { minLength: 8, uppercase: true, number: true, symbol: true } },
      { key: "uploadLimitMb", value: 10 },
      { key: "sessionTimeoutMinutes", value: 30 },
      { key: "examCityOptions", value: tamilNaduExamCities.map((item) => ({ ...item, state: "Tamil Nadu" })) },
      { key: "seedProfile", value: { mode: "exam-paper-ready", seededUsers: ["admin@exam.gov"], seededCandidates: 0, seededApplications: 0, seededExams: 1, seededQuestions: 100 } }
    ]
  });
}

main().finally(async () => prisma.$disconnect());
