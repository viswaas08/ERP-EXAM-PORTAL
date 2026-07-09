FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
RUN npm ci --workspace backend --include-workspace-root
COPY backend backend
RUN npm run prisma:generate --workspace backend
RUN npm run build --workspace backend

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
RUN npm ci --workspace backend --omit=dev --include-workspace-root
COPY --from=build /app/backend/dist backend/dist
COPY --from=build /app/backend/prisma backend/prisma
COPY --from=build /app/node_modules/.prisma node_modules/.prisma
EXPOSE 8080
CMD ["npm", "run", "start", "--workspace", "backend"]
