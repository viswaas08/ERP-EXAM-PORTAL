import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export function signAccessToken(payload: object) {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: "15m" });
}

export function signRefreshToken(payload: object) {
  return jwt.sign(payload, env.jwtRefreshSecret, { expiresIn: "7d" });
}
