import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== CLEANING FRONTEND STATES FROM SYSTEM SETTINGS ===");
  try {
    const deleted = await prisma.systemSetting.deleteMany({
      where: {
        key: {
          startsWith: "examPortal."
        }
      }
    });
    console.log(`Deleted ${deleted.count} state keys from SystemSetting.`);
  } catch (error) {
    console.error("Error cleaning settings:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
