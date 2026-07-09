FROM node:22-alpine AS build
WORKDIR /app
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL
COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
RUN npm ci --include-workspace-root
COPY backend backend
COPY frontend frontend
RUN npm run prisma:generate --workspace backend
RUN npm run build --workspace backend
RUN npm run build --workspace frontend

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV FRONTEND_DIST_PATH=/app/frontend/dist
COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
RUN npm ci --workspace backend --omit=dev --include-workspace-root
COPY --from=build /app/backend/dist backend/dist
COPY --from=build /app/backend/prisma backend/prisma
COPY --from=build /app/frontend/dist frontend/dist
COPY --from=build /app/node_modules/.prisma node_modules/.prisma
EXPOSE 8080
CMD ["npm", "run", "start", "--workspace", "backend"]
