import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== DATABASE INSPECTION ===");
  try {
    const exams = await prisma.examination.findMany({
      select: { id: true, name: true, code: true }
    });
    console.log("Examinations details:");
    console.log(JSON.stringify(exams, null, 2));

    const users = await prisma.user.findMany({
      include: { candidate: true }
    });
    console.log("All users in database:");
    for (const u of users) {
      console.log(`- User: ${u.email} | Name: ${u.name} | Candidate ID: ${u.candidate?.id ?? "None"}`);
    }

    const apps = await prisma.application.findMany({
      include: {
        candidate: { include: { user: true } },
        examination: true
      }
    });
    console.log("\nApplications details:");
    for (const app of apps) {
      console.log(`- AppNo: ${app.applicationNo} | Candidate Email: ${app.candidate.user.email} | Exam Code: ${app.examination.code} | Status: ${app.status}`);
    }

  } catch (error) {
    console.error("Error inspecting database:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
