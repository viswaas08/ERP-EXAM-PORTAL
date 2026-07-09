import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";
import { signAccessToken, signRefreshToken } from "../utils/tokens.js";

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email }, include: { role: { include: { permissions: true } } } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) throw new AppError(401, "Invalid credentials");
  const payload = { id: user.id, role: user.role.name, permissions: user.role.permissions.map((p) => p.code) };
  return {
    user: { id: user.id, name: user.name, email: user.email, role: user.role.name },
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload)
  };
}

export async function resetPassword(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) throw new AppError(404, "No account found for this email");

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash }
  });

  await prisma.auditLog.create({
    data: {
      userEmail: user.email,
      role: "ACCOUNT",
      action: "PASSWORD_RESET",
      affectedRecord: user.id,
      newValue: JSON.stringify({ email: user.email })
    }
  }).catch(() => undefined);

  return { message: "Password reset successfully" };
}

export async function refreshAccessToken(refreshToken: string) {
  let payload: { id?: string };

  try {
    payload = jwt.verify(refreshToken, env.jwtRefreshSecret) as { id?: string };
  } catch {
    throw new AppError(401, "Invalid refresh token");
  }

  if (!payload.id) throw new AppError(401, "Invalid refresh token");

  const user = await prisma.user.findUnique({ where: { id: payload.id }, include: { role: { include: { permissions: true } } } });
  if (!user) throw new AppError(401, "Invalid refresh token");

  const accessPayload = { id: user.id, role: user.role.name, permissions: user.role.permissions.map((permission) => permission.code) };
  return {
    accessToken: signAccessToken(accessPayload),
    user: { id: user.id, name: user.name, email: user.email, role: user.role.name }
  };
}
