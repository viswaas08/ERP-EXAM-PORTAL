import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { env } from "./config/env.js";
import { apiRoutes } from "./routes/index.js";
import { errorHandler } from "./middleware/error.js";

export const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const frontendDistPath = [
  process.env.FRONTEND_DIST_PATH,
  path.resolve(process.cwd(), "frontend/dist"),
  path.resolve(process.cwd(), "../frontend/dist"),
  path.resolve(__dirname, "../../../frontend/dist"),
  path.resolve(__dirname, "../../frontend/dist")
].find((candidate): candidate is string => Boolean(candidate && existsSync(candidate)));

app.use(helmet());
app.use(cors({ origin: env.clientOrigin, credentials: true }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 500 }));
app.use(express.json({ limit: "2mb" }));

app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api", apiRoutes);

if (frontendDistPath) {
  app.use(express.static(frontendDistPath));
  app.get(/^(?!\/api|\/health).*/, (_req, res) => {
    res.sendFile(path.join(frontendDistPath, "index.html"));
  });
}

app.use(errorHandler);
