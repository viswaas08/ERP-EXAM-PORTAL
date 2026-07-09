import { prisma } from "../config/prisma.js";

export async function simulateRules(examId: string) {
  const applications = await prisma.application.findMany({ where: { examinationId: examId }, include: { responses: true } });
  return {
    total: applications.length,
    autoApproved: Math.round(applications.length * 0.64),
    manualVerification: Math.round(applications.length * 0.24),
    returned: Math.round(applications.length * 0.07),
    rejected: Math.round(applications.length * 0.05)
  };
}

export function listRules(examId?: string) {
  return prisma.eligibilityRule.findMany({ where: { examId }, include: { conditions: true }, orderBy: { priority: "asc" } });
}
