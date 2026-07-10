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

    const users = await prisma.user.findMany({
      include: {
        role: {
          include: {
            permissions: true
          }
        }
      }
    });
    console.log("All users in database:");
    for (const u of users) {
      console.log(`- User: ${u.email} | Role: ${u.role.name} | Permissions: ${u.role.permissions.map(p => p.code).join(", ")}`);
    }

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
