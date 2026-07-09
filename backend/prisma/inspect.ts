import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== DATABASE INSPECTION ===");
  try {
    const examsCount = await prisma.examination.count();
    console.log(`Examinations: ${examsCount}`);

    const exams = await prisma.examination.findMany({
      select: { id: true, name: true, code: true }
    });
    console.log("Examinations details:");
    console.log(JSON.stringify(exams, null, 2));

    const candidatesCount = await prisma.candidate.count();
    console.log(`Candidates: ${candidatesCount}`);

    const appsCount = await prisma.application.count();
    console.log(`Applications: ${appsCount}`);

    const settingsCount = await prisma.systemSetting.count();
    console.log(`System Settings: ${settingsCount}`);

    const settings = await prisma.systemSetting.findMany();
    console.log("System Settings details:");
    console.log(JSON.stringify(settings, null, 2));

  } catch (error) {
    console.error("Error inspecting database:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
