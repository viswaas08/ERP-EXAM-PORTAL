import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== CLEANING SEEDED DATA FROM DATABASE ===");
  try {
    // Find all seeded examinations
    const seededExams = await prisma.examination.findMany({
      where: {
        code: {
          startsWith: "EXAM-2026-"
        }
      }
    });

    const examIds = seededExams.map((e) => e.id);
    console.log(`Found ${seededExams.length} seeded examinations to delete.`);

    if (examIds.length === 0) {
      console.log("No seeded examinations found.");
      return;
    }

    // 1. Delete notifications related to these exams
    const deletedNotifications = await prisma.notification.deleteMany({
      where: { examId: { in: examIds } }
    });
    console.log(`Deleted ${deletedNotifications.count} notifications.`);

    // 2. Delete audit logs referencing these exams (optional, let's delete all audit logs to start clean)
    const deletedLogs = await prisma.auditLog.deleteMany({
      where: {
        OR: examIds.flatMap(id => [
          { affectedRecord: { contains: id } }
        ])
      }
    });
    console.log(`Deleted ${deletedLogs.count} audit logs.`);

    // 3. Delete results related to these exams
    const deletedResults = await prisma.result.deleteMany({
      where: { examId: { in: examIds } }
    });
    console.log(`Deleted ${deletedResults.count} results.`);

    // 4. Delete hall tickets related to these exams
    const deletedTickets = await prisma.hallTicket.deleteMany({
      where: { examId: { in: examIds } }
    });
    console.log(`Deleted ${deletedTickets.count} hall tickets.`);

    // 5. Delete candidate responses, exam sessions
    const deletedResponses = await prisma.candidateResponse.deleteMany({
      where: { question: { bank: { examId: { in: examIds } } } }
    });
    console.log(`Deleted ${deletedResponses.count} candidate responses.`);

    const deletedSessions = await prisma.examSession.deleteMany({
      where: { examId: { in: examIds } }
    });
    console.log(`Deleted ${deletedSessions.count} exam sessions.`);

    // 6. Delete questions, options, banks
    const deletedOptions = await prisma.questionOption.deleteMany({
      where: { question: { bank: { examId: { in: examIds } } } }
    });
    console.log(`Deleted ${deletedOptions.count} question options.`);

    const deletedQuestions = await prisma.question.deleteMany({
      where: { bank: { examId: { in: examIds } } }
    });
    console.log(`Deleted ${deletedQuestions.count} questions.`);

    const deletedBanks = await prisma.questionBank.deleteMany({
      where: { examId: { in: examIds } }
    });
    console.log(`Deleted ${deletedBanks.count} question banks.`);

    // 7. Delete applications (and dynamic responses, history, documents)
    const deletedAppDocs = await prisma.applicationDocument.deleteMany({
      where: { application: { examinationId: { in: examIds } } }
    });
    console.log(`Deleted ${deletedAppDocs.count} application documents.`);

    const deletedAppHist = await prisma.applicationHistory.deleteMany({
      where: { application: { examinationId: { in: examIds } } }
    });
    console.log(`Deleted ${deletedAppHist.count} application history logs.`);

    const deletedFormResp = await prisma.dynamicFormResponse.deleteMany({
      where: { application: { examinationId: { in: examIds } } }
    });
    console.log(`Deleted ${deletedFormResp.count} form responses.`);

    const deletedApps = await prisma.application.deleteMany({
      where: { examinationId: { in: examIds } }
    });
    console.log(`Deleted ${deletedApps.count} applications.`);

    // 8. Delete eligibility rules and conditions
    const deletedConditions = await prisma.eligibilityCondition.deleteMany({
      where: { rule: { examId: { in: examIds } } }
    });
    console.log(`Deleted ${deletedConditions.count} eligibility conditions.`);

    const deletedRules = await prisma.eligibilityRule.deleteMany({
      where: { examId: { in: examIds } }
    });
    console.log(`Deleted ${deletedRules.count} eligibility rules.`);

    // 9. Delete dynamic forms (fields, sections, templates)
    const deletedFormFields = await prisma.dynamicFormField.deleteMany({
      where: { section: { template: { examId: { in: examIds } } } }
    });
    console.log(`Deleted ${deletedFormFields.count} dynamic form fields.`);

    const deletedFormSections = await prisma.dynamicFormSection.deleteMany({
      where: { template: { examId: { in: examIds } } }
    });
    console.log(`Deleted ${deletedFormSections.count} dynamic form sections.`);

    const deletedFormTemplates = await prisma.dynamicFormTemplate.deleteMany({
      where: { examId: { in: examIds } }
    });
    console.log(`Deleted ${deletedFormTemplates.count} dynamic form templates.`);

    // 10. Delete workflow phases
    const deletedPhases = await prisma.workflowPhase.deleteMany({
      where: { examId: { in: examIds } }
    });
    console.log(`Deleted ${deletedPhases.count} workflow phases.`);

    // 11. Delete centres
    const deletedCentres = await prisma.examCentre.deleteMany({
      where: { examId: { in: examIds } }
    });
    console.log(`Deleted ${deletedCentres.count} centres.`);

    // 12. Delete examinations
    const deletedExams = await prisma.examination.deleteMany({
      where: { id: { in: examIds } }
    });
    console.log(`Deleted ${deletedExams.count} examinations.`);

    console.log("Cleanup completed successfully.");
  } catch (error) {
    console.error("Error cleaning seeded data:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
