import { api } from "./api";

export type CandidatePhaseSnapshot = {
  exam: {
    id: string;
    code: string;
    name: string;
    durationMinutes: number;
  };
  activePhase?: {
    id: string;
    name: string;
    status: string;
    opensAt: string;
    closesAt: string;
  };
  access: {
    registration: boolean;
    correction: boolean;
    documentVerification: boolean;
    eligibilityVerification: boolean;
    hallTicket: boolean;
    onlineExam: boolean;
    evaluation: boolean;
    result: boolean;
    archiveDownloads: boolean;
  };
  phases?: Array<{
    id: string;
    name: string;
    status: string;
    opensAt: string;
    closesAt: string;
  }>;
};

export type LiveExam = {
  id: string;
  code: string;
  name: string;
  department: string;
  status: string;
  workflowPhases: Array<{
    id: string;
    name: string;
    status: string;
    opensAt: string;
    closesAt: string;
  }>;
  _count?: {
    applications: number;
    questionBanks: number;
    centres: number;
  };
};

export const fallbackPhase: CandidatePhaseSnapshot = {
  exam: { id: "none", code: "NOT-CONFIGURED", name: "No active examination", durationMinutes: 0 },
  activePhase: { id: "none", name: "Registration", status: "CLOSED", opensAt: "", closesAt: "" },
  access: {
    registration: true,
    correction: false,
    documentVerification: false,
    eligibilityVerification: false,
    hallTicket: false,
    onlineExam: false,
    evaluation: false,
    result: false,
    archiveDownloads: false
  }
};

export function getCandidatePhase(examId?: string) {
  return api<CandidatePhaseSnapshot>(`/candidate-public/active-phase${examId ? `?examId=${encodeURIComponent(examId)}` : ""}`);
}

export function getLiveExams() {
  return api<LiveExam[]>("/candidate-public/live-exams");
}
