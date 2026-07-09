import { Router } from "express";
import { prisma } from "../config/prisma.js";

export const stateRoutes = Router();

stateRoutes.get("/:key", async (req, res) => {
  const setting = await prisma.systemSetting.findUnique({
    where: { key: req.params.key }
  });

  res.json({ key: req.params.key, value: setting?.value ?? null });
});

stateRoutes.put("/:key", async (req, res) => {
  const setting = await prisma.systemSetting.upsert({
    where: { key: req.params.key },
    create: {
      key: req.params.key,
      value: req.body.value
    },
    update: {
      value: req.body.value
    }
  });

  await prisma.auditLog.create({
    data: {
      userEmail: "api",
      role: "SYSTEM",
      action: "ERP_STATE_SAVE",
      affectedRecord: req.params.key,
      newValue: JSON.stringify(req.body.value)
    }
  }).catch(() => undefined);

  res.json({ key: setting.key, value: setting.value });
});
