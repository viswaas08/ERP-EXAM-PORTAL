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
  exam: { id: "demo", code: "NRE-2026", name: "National Recruitment Examination" },
  activePhase: { id: "demo-phase", name: "Hall Ticket Release", status: "OPEN", opensAt: "", closesAt: "" },
  access: {
    registration: false,
    correction: false,
    documentVerification: false,
    eligibilityVerification: false,
    hallTicket: true,
    onlineExam: false,
    result: false,
    archiveDownloads: false
  }
};

export function getCandidatePhase() {
  return api<CandidatePhaseSnapshot>("/candidate/active-phase");
}
