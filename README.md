# Centralized Competitive Examination Management Portal

Enterprise-grade demo portal for managing competitive examinations from registration through result publication.

## Stack

- React 19, Vite, TypeScript, Tailwind CSS, React Router, React Hook Form, Zod, TanStack Query, Recharts, Lucide React
- Node.js, Express, TypeScript, Prisma ORM
- PostgreSQL, JWT auth, RBAC, bcrypt, Cloudinary-ready file storage, PDF generation

## Local Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy backend environment file:

   ```bash
   cp backend/.env.example backend/.env
   ```

3. Start PostgreSQL with Docker, or point `DATABASE_URL` at Neon:

   ```bash
   docker compose up -d
   ```

4. Prepare the database:

   ```bash
   npm run prisma:migrate
   npm run seed
   ```

5. Run the application:

   ```bash
   npm run dev
   ```

Frontend: `http://localhost:5173`

Backend: `http://localhost:8080/api`

## Demo Users

- Super Admin: `admin@exam.gov` / `Password@123`
- Controller: `controller@exam.gov` / `Password@123`
- Candidate: `candidate@exam.gov` / `Password@123`

## Deployment

- Frontend: deploy `frontend` to Vercel with `VITE_API_URL`.
- Backend: deploy `backend` to Render with `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, and Cloudinary variables.
- Database: Neon PostgreSQL free tier.
- Storage: Cloudinary free tier.

### Render Docker Deployment

This repository includes:

- `backend/Dockerfile` for the Express API
- `frontend/Dockerfile` for the React frontend served by Nginx
- `render.yaml` for Render Blueprint deployment

On Render, set these secrets in the dashboard:

- `DATABASE_URL`
- `CLIENT_ORIGIN`
- `VITE_API_URL`
- Cloudinary variables if file upload is enabled

After the backend service is live, run the Prisma migration and seed commands from a Render shell or a trusted local machine:

```bash
npm run prisma:migrate --workspace backend
npm run seed --workspace backend
```

## Main Modules

- Configurable examination management
- Workflow phase engine
- Dynamic registration form builder
- Eligibility rule engine with simulation and audit logs
- Application review and document verification
- Centre allocation and hall ticket generation
- Question bank and online examination console
- Result processing and score card generation
- RBAC, audit logs, notifications, analytics, and system settings
