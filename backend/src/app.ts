import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env } from "./config/env.js";
import { apiRoutes } from "./routes/index.js";
import { errorHandler } from "./middleware/error.js";

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.clientOrigin, credentials: true }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 500 }));
app.use(express.json({ limit: "2mb" }));

app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api", apiRoutes);
app.use(errorHandler);
