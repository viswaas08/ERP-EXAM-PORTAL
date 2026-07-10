import { prisma } from "../config/prisma.js";

function matchCondition(profile: any, cond: any): boolean {
  if (!profile) return false;
  
  let val: any;
  const fieldLower = cond.field.toLowerCase();
  if (fieldLower.includes("qualification")) {
    val = profile.qualification;
  } else if (fieldLower.includes("percentage")) {
    val = profile.percentage;
  } else if (fieldLower.includes("nationality")) {
    val = profile.nationality;
  } else if (fieldLower.includes("category")) {
    val = profile.category;
  } else if (fieldLower.includes("state")) {
    val = profile.state;
  } else if (fieldLower.includes("district")) {
    val = profile.district;
  } else if (fieldLower.includes("phone")) {
    val = profile.phone;
  } else {
    return false;
  }

  if (val === undefined || val === null) {
    if (cond.operator === "is empty") return true;
    return false;
  }

  const condVal = String(cond.value || "").trim();
  const operator = cond.operator.toLowerCase();

  if (operator === "is empty") {
    return String(val).trim() === "";
  }
  if (operator === "is not empty") {
    return String(val).trim() !== "";
  }

  if (typeof val === "number" || !isNaN(Number(val))) {
    const numVal = Number(val);
    const numCondVal = Number(condVal);
    if (operator === "greater than" || operator.includes(">")) return numVal > numCondVal;
    if (operator === "greater than or equal" || operator.includes(">=")) return numVal >= numCondVal;
    if (operator === "less than" || operator.includes("<")) return numVal < numCondVal;
    if (operator === "less than or equal" || operator.includes("<=")) return numVal <= numCondVal;
    if (operator === "equals" || operator === "=") return numVal === numCondVal;
    if (operator === "not equals" || operator === "!=") return numVal !== numCondVal;
  }

  const strVal = String(val).toLowerCase();
  const strCond = condVal.toLowerCase();

  if (operator === "equals" || operator === "=") return strVal === strCond;
  if (operator === "not equals" || operator === "!=") return strVal !== strCond;
  if (operator === "contains") return strVal.includes(strCond);

  return false;
}

function evaluateRuleMatch(profile: any, conditions: any[]): boolean {
  if (!conditions.length) return false;
  
  let match = true;
  for (let i = 0; i < conditions.length; i++) {
    const cond = conditions[i];
    const itemMatch = matchCondition(profile, cond);
    if (i === 0) {
      match = itemMatch;
    } else {
      const prevConnector = conditions[i - 1]?.connector || "AND";
      if (prevConnector === "OR") {
        match = match || itemMatch;
      } else {
        match = match && itemMatch;
      }
    }
  }
  return match;
}

export async function simulateRules(examId: string) {
  const applications = await prisma.application.findMany({
    where: { examinationId: examId },
    include: { candidate: { include: { profile: true } } }
  });

  const rules = await prisma.eligibilityRule.findMany({
    where: { examId },
    include: { conditions: true },
    orderBy: { priority: "asc" }
  });

  let autoApproved = 0;
  let manualVerification = 0;
  let returned = 0;
  let rejected = 0;

  for (const app of applications) {
    let matchedRuleAction = null;
    const profile = app.candidate?.profile;

    for (const rule of rules) {
      if (evaluateRuleMatch(profile, rule.conditions)) {
        matchedRuleAction = rule.action;
        break;
      }
    }

    if (matchedRuleAction === "APPROVE") {
      autoApproved++;
    } else if (matchedRuleAction === "REJECT") {
      rejected++;
    } else if (matchedRuleAction === "RETURN") {
      returned++;
    } else {
      manualVerification++;
    }
  }

  return {
    total: applications.length,
    autoApproved,
    manualVerification,
    returned,
    rejected
  };
}

export async function executeRules(examId: string) {
  const applications = await prisma.application.findMany({
    where: { examinationId: examId },
    include: { candidate: { include: { profile: true } } }
  });

  const rules = await prisma.eligibilityRule.findMany({
    where: { examId },
    include: { conditions: true },
    orderBy: { priority: "asc" }
  });

  let count = 0;

  await prisma.$transaction(async (tx) => {
    for (const app of applications) {
      let matchedRuleAction = null;
      let matchedRuleName = "";
      const profile = app.candidate?.profile;

      for (const rule of rules) {
        if (evaluateRuleMatch(profile, rule.conditions)) {
          matchedRuleAction = rule.action;
          matchedRuleName = rule.name;
          break;
        }
      }

      if (matchedRuleAction) {
        let status = "PENDING";
        if (matchedRuleAction === "APPROVE") status = "APPROVED";
        else if (matchedRuleAction === "REJECT") status = "REJECTED";
        else if (matchedRuleAction === "RETURN") status = "RETURNED";

        if (status !== app.status) {
          await tx.application.update({
            where: { id: app.id },
            data: {
              status,
              history: {
                create: {
                  status,
                  remarks: `Bulk processed by rule: ${matchedRuleName}`
                }
              }
            }
          });
          count++;
        }
      }
    }
  });

  return { updated: count };
}

export async function saveRules(examId: string, ruleData: any[]) {
  return prisma.$transaction(async (tx) => {
    const existingRules = await tx.eligibilityRule.findMany({ where: { examId } });
    for (const r of existingRules) {
      await tx.eligibilityCondition.deleteMany({ where: { ruleId: r.id } });
    }
    await tx.eligibilityRule.deleteMany({ where: { examId } });

    const saved = [];
    for (const [index, r] of ruleData.entries()) {
      const created = await tx.eligibilityRule.create({
        data: {
          examId,
          name: r.name || `Rule ${index + 1}`,
          priority: Number(r.priority ?? (index + 1)),
          action: String(r.action || "APPROVE"),
          conditions: {
            create: (r.conditions || []).map((c: any) => ({
              field: String(c.field),
              operator: String(c.operator),
              value: String(c.value),
              connector: String(c.connector || "AND")
            }))
          }
        },
        include: { conditions: true }
      });
      saved.push(created);
    }
    return saved;
  });
}

export function listRules(examId?: string) {
  if (!examId) return [];
  return prisma.eligibilityRule.findMany({ where: { examId }, include: { conditions: true }, orderBy: { priority: "asc" } });
}
