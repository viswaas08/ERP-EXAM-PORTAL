import "dotenv/config";

export const env = {
  port: Number(process.env.PORT ?? 8080),
  jwtSecret: process.env.JWT_SECRET ?? "dev-access-secret",
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET ?? "dev-refresh-secret",
  clientOrigin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173"
};
