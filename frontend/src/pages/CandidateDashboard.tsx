import { Download, FileText, LogOut, MonitorPlay, RefreshCw, Ticket } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Badge, Button, Card, Select } from "../components/ui";
import { fallbackPhase, getCandidatePhase, type CandidatePhaseSnapshot } from "../lib/workflow";
import { usePersistentState } from "../lib/usePersistentState";
import { API_URL, api } from "../lib/api";

const fallbackWorkflow = ["Registration", "Correction Window", "Document Verification", "Eligibility Verification", "Hall Ticket Release", "Online Examination", "Evaluation", "Result Publication", "Archive"];

type CandidateDashboardData = {
  profile: null | {
    phone: string;
    category: string;
    qualification: string;
    percentage: number;
    state: string;
    district: string;
  };
  application: null | CandidateApplication;
  applications?: CandidateApplication[];
  phase: CandidatePhaseSnapshot;
};

type CandidateApplication = {
    id?: string;
    applicationNo: string;
    status: string;
    examination: { id?: string; name: string; code: string };
    documents: Array<{ type: string; status: string }>;
    hallTicket: null | { id: string; rollNumber: string; seatNumber: string; reportingTime: string; centre: { name: string } };
    result: null | { marks: number; percentage: number; rank: number; qualified: boolean; status?: string };
};

export function CandidateDashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [notice, setNotice] = usePersistentState("examPortal.candidateDashboard.v2.notice", "Candidate dashboard loads from the database.");
  const [resultVisible, setResultVisible] = usePersistentState("examPortal.candidateDashboard.resultVisible", false);
  const [selectedPhaseName, setSelectedPhaseName] = usePersistentState("examPortal.candidateDashboard.selectedPhaseName", "");
  const [phase, setPhase] = useState<CandidatePhaseSnapshot>(fallbackPhase);
  const [dashboard, setDashboard] = useState<CandidateDashboardData | null>(null);
  const [selectedApplicationNo, setSelectedApplicationNo] = usePersistentState("examPortal.candidateDashboard.selectedApplicationNo", "");

  async function loadDashboard() {
    api<CandidateDashboardData>("/candidate/dashboard")
      .then((data) => {
        setDashboard(data);
        setPhase(data.phase);
        const applications = data.applications ?? (data.application ? [data.application] : []);
        setSelectedApplicationNo((current) => {
          if (applications.some((item) => item.applicationNo === current)) return current;
          return applications.find((item) => item.hallTicket)?.applicationNo || applications[0]?.applicationNo || "";
        });
        setSelectedPhaseName(data.phase.activePhase?.name ?? "");
        setNotice(data.application ? `${data.application.applicationNo} loaded from Neon database.` : "No database application found yet. Submit registration first.");
      })
      .catch(() => setNotice("Login as a candidate to view saved applications from the database."));
  }

  useEffect(() => {
    void loadDashboard();
    const refresh = window.setInterval(() => void loadDashboard(), 15000);
    return () => window.clearInterval(refresh);
  }, []);

  const applications = dashboard?.applications ?? (dashboard?.application ? [dashboard.application] : []);
  const selectedApplication = applications.find((item) => item.applicationNo === selectedApplicationNo) ?? applications[0] ?? null;

  useEffect(() => {
    const examId = selectedApplication?.examination.id;
    if (!examId) return;
    getCandidatePhase(examId)
      .then((snapshot) => {
        setPhase(snapshot);
        setSelectedPhaseName(snapshot.activePhase?.name ?? "");
      })
      .catch(() => undefined);
  }, [selectedApplication?.examination.id]);

  const workflowPhases = phase.phases?.length ? phase.phases : fallbackWorkflow.map((name, index) => ({
    id: name,
    name,
    status: phase.activePhase?.name === name || (!phase.activePhase && index === 0) ? "OPEN" : "SCHEDULED",
    opensAt: "",
    closesAt: ""
  }));
  const activePhaseIndex = Math.max(0, workflowPhases.findIndex((item) => item.id === phase.activePhase?.id || item.name === phase.activePhase?.name || item.status === "OPEN"));
  const publishedResult = selectedApplication?.result?.status === "PUBLISHED" ? selectedApplication.result : null;
  const hallTicketMessage = selectedApplication?.hallTicket
    ? `Roll No ${selectedApplication.hallTicket.rollNumber}, ${selectedApplication.hallTicket.centre.name}.`
    : selectedApplication?.status !== "APPROVED"
      ? "Hall ticket unlocks after admin approves this application."
      : phase.access.hallTicket || phase.access.archiveDownloads
        ? "Hall ticket is being generated. This page refreshes automatically."
        : `Hall ticket is locked during ${phase.activePhase?.name ?? "the current phase"}.`;

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  function downloadFile(name: string, content: string) {
    const url = URL.createObjectURL(new Blob([content], { type: "text/plain" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function downloadHallTicketPdf() {
    const ticket = selectedApplication?.hallTicket;
    if (!ticket) return;
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`${API_URL}/api/hall-tickets/${ticket.id}.pdf`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!response.ok) throw new Error("PDF download failed");
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = `${selectedApplication?.applicationNo ?? "hall-ticket"}-hall-ticket.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      setNotice("Hall ticket PDF downloaded.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Hall ticket PDF download failed.");
    }
  }

  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-5">
        <Card className="border-l-4 border-l-primary py-3 text-sm font-medium">{notice}</Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h1 className="text-2xl font-bold">Candidate Dashboard</h1><p className="text-sm text-slate-500">Current examination phase, application timeline, downloads, and result access.</p></div>
          <div className="flex flex-wrap items-center gap-2">
            {applications.length > 0 && <Select className="max-w-xs" value={selectedApplication?.applicationNo ?? ""} onChange={(event) => setSelectedApplicationNo(event.target.value)}>{applications.map((item) => <option key={item.applicationNo} value={item.applicationNo}>{item.examination.code} - {item.applicationNo} - {item.hallTicket ? "Hall Ticket Ready" : item.status}</option>)}</Select>}
            <Badge className="bg-emerald-50 text-emerald-700">Current Phase: {phase.activePhase?.name ?? "Loading"}</Badge>
            <Button className="bg-secondary" onClick={() => { void loadDashboard(); setNotice("Dashboard refreshed from database."); }}><RefreshCw size={18} /> Refresh</Button>
            <Button className="bg-destructive" onClick={handleLogout}><LogOut size={18} /> Logout</Button>
          </div>
        </div>
        {!selectedApplication ? (
          <Card><h2 className="font-semibold">No Application Found</h2><p className="mt-2 text-sm text-slate-500">Submit a candidate registration to see examination-specific application details here.</p><div className="mt-4"><Link to="/register"><Button>Open Registration</Button></Link></div></Card>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-4">{[
              `Application ${selectedApplication.status}`,
              `${selectedApplication.documents.length} Documents Uploaded`,
              selectedApplication.hallTicket ? "Hall Ticket Ready" : "Hall Ticket Pending",
              publishedResult ? "Result Published" : "Result Pending"
            ].map((item) => <Card key={item}><p className="font-semibold">{item}</p></Card>)}</div>
            <Card><h2 className="mb-4 font-semibold">Admin Workflow Phase</h2><div className="grid gap-2 md:grid-cols-4 xl:grid-cols-8">{workflowPhases.map((item, i) => {
              const isCurrent = i === activePhaseIndex;
              const isDone = i < activePhaseIndex;
              return <button className={`rounded-md border border-border p-3 text-left ${isCurrent ? "bg-primary text-white" : selectedPhaseName === item.name ? "bg-muted" : ""}`} key={item.id} onClick={() => { setSelectedPhaseName(item.name); setNotice(`${item.name} selected. Current live phase is ${phase.activePhase?.name ?? "not available"}.`); }}><Badge>{isCurrent ? "Current" : isDone ? "Done" : "Pending"}</Badge><p className="mt-2 text-sm font-semibold">{item.name}</p></button>;
            })}</div></Card>
            <div className="grid gap-4 md:grid-cols-3">
              <Card><Ticket className="mb-3 text-primary" /><h2 className="font-semibold">Hall Ticket</h2><p className="my-3 text-sm text-slate-500">{hallTicketMessage}</p><Button disabled={!selectedApplication.hallTicket} onClick={downloadHallTicketPdf}><Download size={18} /> Download PDF</Button></Card>
              <Card><MonitorPlay className="mb-3 text-secondary" /><h2 className="font-semibold">Online Examination</h2><p className="my-3 text-sm text-slate-500">{phase.access.onlineExam ? "Exam console is enabled for this application." : `Exam locked during ${phase.activePhase?.name ?? "the current phase"}.`}</p>{phase.access.onlineExam ? <Link to="/exam"><Button>Open Exam Console</Button></Link> : <Button disabled>Open Exam Console</Button>}</Card>
              <Card><FileText className="mb-3 text-amber-600" /><h2 className="font-semibold">Result</h2><p className="my-3 text-sm text-slate-500">{resultVisible && publishedResult ? `Marks ${publishedResult.marks}, Rank ${publishedResult.rank}, ${publishedResult.qualified ? "Qualified" : "Not Qualified"}.` : "No result has been published for this application."}</p><div className="flex flex-wrap gap-2"><Button disabled={!publishedResult} onClick={() => { setResultVisible(true); setNotice("Result opened from database."); }}>View Result</Button>{resultVisible && publishedResult && <Button className="bg-secondary" onClick={() => downloadFile("score-card.txt", `Score Card\nMarks: ${publishedResult.marks}\nRank: ${publishedResult.rank}\nQualified: ${publishedResult.qualified ? "Yes" : "No"}`)}>Download</Button>}</div></Card>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
