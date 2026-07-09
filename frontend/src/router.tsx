import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { AdminDashboard } from "./pages/AdminDashboard";
import { Examinations } from "./pages/Examinations";
import { FormBuilder } from "./pages/FormBuilder";
import { EligibilityRules } from "./pages/EligibilityRules";
import { Applications } from "./pages/Applications";
import { Verification } from "./pages/Verification";
import { Centres } from "./pages/Centres";
import { HallTickets } from "./pages/HallTickets";
import { QuestionBank } from "./pages/QuestionBank";
import { Results } from "./pages/Results";
import { AuditLogs } from "./pages/AuditLogs";
import { Settings } from "./pages/Settings";
import { CandidatePortal } from "./pages/CandidatePortal";
import { CandidateDashboard } from "./pages/CandidateDashboard";
import { OnlineExam } from "./pages/OnlineExam";
import { Login } from "./pages/Login";
import { ProtectedRoute } from "./auth/ProtectedRoute";

export const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/login" /> },
  { path: "/login", element: <Login /> },
  {
    path: "/admin",
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: "examinations", element: <Examinations /> },
      { path: "form-builder", element: <FormBuilder /> },
      { path: "rules", element: <EligibilityRules /> },
      { path: "applications", element: <Applications /> },
      { path: "verification", element: <Verification /> },
      { path: "centres", element: <Centres /> },
      { path: "hall-tickets", element: <HallTickets /> },
      { path: "questions", element: <QuestionBank /> },
      { path: "results", element: <Results /> },
      { path: "audit", element: <AuditLogs /> },
      { path: "settings", element: <Settings /> }
    ]
  },
  { path: "/register", element: <CandidatePortal /> },
  { path: "/candidate", element: <CandidateDashboard /> },
  { path: "/exam", element: <OnlineExam /> }
]);
