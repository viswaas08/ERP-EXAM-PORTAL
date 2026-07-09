import { api } from "./api";

export type CandidatePhaseSnapshot = {
  exam: {
    id: string;
    code: string;
    name: string;
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
    result: boolean;
    archiveDownloads: boolean;
  };
};

export const fallbackPhase: CandidatePhaseSnapshot = {
  exam: { id: "none", code: "NOT-CONFIGURED", name: "No active examination" },
  activePhase: { id: "none", name: "Registration", status: "CLOSED", opensAt: "", closesAt: "" },
  access: {
    registration: true,
    correction: false,
    documentVerification: false,
    eligibilityVerification: false,
    hallTicket: false,
    onlineExam: false,
    result: false,
    archiveDownloads: false
  }
};

export function getCandidatePhase() {
  return api<CandidatePhaseSnapshot>("/candidate-public/active-phase");
}
