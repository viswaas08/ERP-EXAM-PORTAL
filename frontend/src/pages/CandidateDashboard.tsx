import { Download, FileText, LogOut, MonitorPlay, RefreshCw, Ticket, ListChecks } from "lucide-react";
import { useEffect, useRef, useState, useMemo } from "react";
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
  attempts?: Array<{
    id: string;
    attemptNumber: number;
    score: number;
    percentage: number;
    rank: number;
    resultStatus: string;
    submittedAt: string;
    published: boolean;
  }>;
};

type CandidateApplication = {
  id?: string;
  applicationNo: string;
  status: string;
  examination: { id?: string; name: string; code: string; maximumAttempts?: number };
  documents: Array<{ type: string; status: string }>;
  hallTicket: null | { id: string; rollNumber: string; seatNumber: string; reportingTime: string; centre: { name: string } };
  result: null | { id?: string; marks: number; percentage: number; rank: number; qualified: boolean; status?: string };
};

export function CandidateDashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [notice, setNotice] = usePersistentState("examPortal.candidateDashboard.v2.notice", "Candidate dashboard loaded.");
  const [selectedPhaseName, setSelectedPhaseName] = usePersistentState("examPortal.candidateDashboard.selectedPhaseName", "");
  const [phase, setPhase] = useState<CandidatePhaseSnapshot>(fallbackPhase);
  const [dashboard, setDashboard] = useState<CandidateDashboardData | null>(null);
  const [selectedApplicationNo, setSelectedApplicationNo] = usePersistentState("examPortal.candidateDashboard.selectedApplicationNo", "");
  const [calculationPolicy, setCalculationPolicy] = useState("latest"); // "latest" | "highest"
  const [rankThreshold, setRankThreshold] = useState<number>(500);

  const applicationsRef = useRef<CandidateApplication[]>([]);

  async function loadDashboard(targetAppNo?: string, targetExamId?: string) {
    const appNo = targetAppNo || selectedApplicationNo;
    // Use explicit examId if provided, otherwise look it up from the applications ref
    let examId = targetExamId || "";
    if (!examId && appNo) {
      const knownApps = applicationsRef.current;
      const targetApp = knownApps.find((a) => a.applicationNo === appNo);
      examId = targetApp?.examination.id || "";
    }
    const url = examId ? `/candidate/dashboard?examId=${encodeURIComponent(examId)}` : "/candidate/dashboard";

    api<CandidateDashboardData>(url)
      .then((data) => {
        setDashboard(data);
        const apps = data.applications ?? (data.application ? [data.application] : []);
        applicationsRef.current = apps;
        if (data.phase) {
          setPhase(data.phase);
          setSelectedPhaseName(data.phase.activePhase?.name ?? "");
        }
        // Only auto-select if no current selection or current selection not found
        setSelectedApplicationNo((current) => {
          const activeAppNo = targetAppNo || current;
          if (activeAppNo && apps.find((item) => item.applicationNo === activeAppNo)) {
            return activeAppNo;
          }
          return apps.find((item) => item.hallTicket)?.applicationNo || apps[0]?.applicationNo || "";
        });
      })
      .catch(() => setNotice("Login as a candidate to view dashboard."));
  }

  function handleExamSwitch(appNo: string) {
    // Find the examId from the current applications list
    const apps = applicationsRef.current;
    const targetApp = apps.find((a) => a.applicationNo === appNo);
    const examId = targetApp?.examination.id || "";
    setSelectedApplicationNo(appNo);
    // Clear stale attempts immediately so the UI doesn't show old exam data
    setDashboard((prev) => prev ? { ...prev, attempts: [] } : prev);
    void loadDashboard(appNo, examId);
  }

  // Initial load
  useEffect(() => {
    void loadDashboard();
  }, []);

  // Poll for updates every 10 seconds (non-disruptive)
  useEffect(() => {
    const refresh = window.setInterval(() => {
      void loadDashboard(selectedApplicationNo);
    }, 10000);
    return () => window.clearInterval(refresh);
  }, [selectedApplicationNo]);

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

    api<{ value: number | null }>(`/state/rankThreshold_${examId}`)
      .then((res) => {
        if (res.value !== null && !isNaN(Number(res.value))) {
          setRankThreshold(Number(res.value));
        } else {
          setRankThreshold(500);
        }
      })
      .catch(() => setRankThreshold(500));
  }, [selectedApplication?.examination.id]);

  const workflowPhases = phase.phases?.length ? phase.phases : fallbackWorkflow.map((name, index) => ({
    id: name,
    name,
    status: phase.activePhase?.name === name || (!phase.activePhase && index === 0) ? "OPEN" : "SCHEDULED",
    opensAt: "",
    closesAt: ""
  }));

  const activePhaseIndex = Math.max(0, workflowPhases.findIndex((item) => item.id === phase.activePhase?.id || item.name === phase.activePhase?.name || item.status === "OPEN"));

  // Calculate attempts completed
  const candidateAttempts = useMemo(() => {
    return dashboard?.attempts ?? [];
  }, [dashboard]);

  // Determine active result based on policy
  const activeAttempt = useMemo(() => {
    if (!candidateAttempts.length) return null;
    if (calculationPolicy === "highest") {
      return [...candidateAttempts].sort((a, b) => b.score - a.score)[0];
    }
    return [...candidateAttempts].sort((a, b) => b.attemptNumber - a.attemptNumber)[0];
  }, [candidateAttempts, calculationPolicy]);

  const maxAttempts = selectedApplication?.examination.maximumAttempts || 1;
  const attemptsRemaining = Math.max(0, maxAttempts - candidateAttempts.length);

  const publishedResult = selectedApplication?.result?.status === "PUBLISHED" ? selectedApplication.result : null;

  const resultMessage = useMemo(() => {
    if (publishedResult) {
      if (publishedResult.qualified) {
        if (publishedResult.rank <= rankThreshold) {
          return "you are eligible for the admission process pleasse procced with the instruction";
        } else {
          return "not eligible for the admission.";
        }
      } else {
        return "you are not eligible for the admission";
      }
    }

    if (!activeAttempt) {
      return phase.access.result
        ? "Result publication is active, but you have not completed any attempts."
        : `Result is locked during ${phase.activePhase?.name ?? "the current phase"}.`;
    }
    
    return "Result is awaiting publication from the administration.";
  }, [activeAttempt, publishedResult, phase.access.result, phase.activePhase?.name, rankThreshold]);

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
      <div className="mx-auto max-w-6xl space-y-6">
        <Card className="border-l-4 border-l-primary py-3 text-sm font-semibold bg-primary/5 text-primary flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          {notice}
        </Card>

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Candidate Dashboard</h1>
            <p className="text-sm text-slate-500">Track registration, download hall tickets, take examinations, and view evaluated results.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {applications.length > 0 && (
              <Select className="max-w-xs" value={selectedApplication?.applicationNo ?? ""} onChange={(event) => handleExamSwitch(event.target.value)}>
                {applications.map((item) => (
                  <option key={item.applicationNo} value={item.applicationNo}>
                    {item.examination.code} - {item.applicationNo} - {item.hallTicket ? "Hall Ticket Ready" : item.status}
                  </option>
                ))}
              </Select>
            )}
            <Badge className="bg-emerald-50 text-emerald-700 font-semibold">
              Current Phase: {phase.activePhase?.name ?? "Loading"}
            </Badge>
            <Button className="bg-slate-100 text-slate-700 hover:bg-slate-200" onClick={() => { void loadDashboard(); setNotice("Dashboard updated."); }}>
              <RefreshCw size={16} />
            </Button>
            <Button className="bg-destructive" onClick={handleLogout}><LogOut size={16} /> Logout</Button>
          </div>
        </div>

        {!selectedApplication ? (
          <Card className="text-center py-12 border-2 border-dashed border-slate-200">
            <h2 className="font-bold text-slate-800">No Application Found</h2>
            <p className="text-sm text-slate-500 mt-2">Submit a candidate registration to display examination credentials here.</p>
            <div className="mt-4">
              <Link to="/register"><Button>Open Registration</Button></Link>
            </div>
          </Card>
        ) : (
          <>
            {/* Quick Status Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              {[
                { title: "Application Status", value: selectedApplication.status, color: "text-slate-800" },
                { title: "Uploaded Documents", value: `${selectedApplication.documents.length} Docs`, color: "text-slate-800" },
                { title: "Remaining Attempts", value: `${attemptsRemaining} of ${maxAttempts}`, color: attemptsRemaining > 0 ? "text-emerald-600 font-bold" : "text-destructive font-bold" },
                { title: "Result Publication", value: publishedResult ? "Published" : "Pending", color: "text-slate-800" }
              ].map((item) => (
                <Card key={item.title} className="p-4 border border-border shadow-sm flex flex-col justify-center">
                  <p className="text-xs text-slate-500 font-medium">{item.title}</p>
                  <p className={`text-base font-bold mt-1 ${item.color}`}>{item.value}</p>
                </Card>
              ))}
            </div>

            {/* Workflow Phases */}
            <Card className="border border-border">
              <h2 className="mb-4 font-bold text-sm text-slate-800">Examination Workflow Timeline</h2>
              <div className="grid gap-2 md:grid-cols-4 xl:grid-cols-9">
                {workflowPhases.map((item, i) => {
                  const isCurrent = i === activePhaseIndex;
                  const isDone = i < activePhaseIndex;
                  return (
                    <div
                      className={`rounded-md border p-3 text-left transition-colors ${isCurrent ? "bg-primary text-white border-primary" : selectedPhaseName === item.name ? "bg-muted border-border" : "border-slate-100"}`}
                      key={item.id}
                    >
                      <Badge className={isCurrent ? "bg-white text-primary border-transparent" : isDone ? "bg-emerald-50 text-emerald-700 border-emerald-100" : ""}>
                        {isCurrent ? "Current" : isDone ? "Done" : "Scheduled"}
                      </Badge>
                      <p className={`mt-2 text-xs font-bold ${isCurrent ? "text-white" : "text-slate-800"}`}>{item.name}</p>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Actions Panel */}
            <div className="grid gap-6 md:grid-cols-3">
              {/* Hall Ticket Card */}
              <Card className="border border-border flex flex-col justify-between h-full">
                <div>
                  <Ticket className="mb-3 text-primary" size={24} />
                  <h2 className="font-bold text-slate-900 text-sm">Hall Ticket Release</h2>
                  <p className="my-3 text-xs text-slate-500 leading-relaxed">{hallTicketMessage}</p>
                </div>
                <Button className="w-full" disabled={!selectedApplication.hallTicket} onClick={downloadHallTicketPdf}>
                  <Download size={16} /> Download Hall Ticket PDF
                </Button>
              </Card>

              {/* Online Exam Card */}
              <Card className="border border-border flex flex-col justify-between h-full">
                <div>
                  <MonitorPlay className="mb-3 text-emerald-600" size={24} />
                  <h2 className="font-bold text-slate-900 text-sm">Online Examination</h2>
                  <p className="my-3 text-xs text-slate-500 leading-relaxed">
                    {!phase.access.onlineExam
                      ? `Exam console is locked until "Online Examination" phase becomes active.`
                      : attemptsRemaining <= 0
                        ? "Attempt limit reached. You cannot launch the console."
                        : `Online examination console is active. Launch to start attempt #${candidateAttempts.length + 1}.`}
                  </p>
                </div>
                {phase.access.onlineExam && attemptsRemaining > 0 ? (
                  <Link to={`/exam?examId=${selectedApplication?.examination.id || ""}`} className="w-full">
                    <Button className="bg-emerald-600 w-full hover:opacity-90">Open Exam Console</Button>
                  </Link>
                ) : (
                  <Button className="w-full" disabled>Open Exam Console</Button>
                )}
              </Card>

              {/* Result Card */}
              <Card className="border border-border flex flex-col justify-between h-full">
                <div>
                  <FileText className="mb-3 text-amber-600" size={24} />
                  <div className="flex items-center justify-between">
                    <h2 className="font-bold text-slate-900 text-sm">Evaluated Result</h2>
                    {candidateAttempts.length > 1 && (
                      <select
                        className="text-[10px] font-semibold border rounded px-1.5 py-0.5 bg-slate-50 text-slate-700 outline-none"
                        value={calculationPolicy}
                        onChange={(e) => setCalculationPolicy(e.target.value)}
                      >
                        <option value="latest">Latest Attempt</option>
                        <option value="highest">Highest Score</option>
                      </select>
                    )}
                  </div>
                  <p className="my-3 text-xs text-slate-600 leading-relaxed font-medium bg-slate-50 border p-3 rounded-md min-h-[55px]">
                    {resultMessage}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1 text-xs" disabled={!publishedResult} onClick={() => void loadDashboard()}>
                    Verify Result
                  </Button>
                  {publishedResult && (
                    <Button
                      className="bg-secondary text-xs px-2"
                      onClick={() => downloadFile(`${selectedApplication.applicationNo}-score-card.txt`, `Score Card\nApplication: ${selectedApplication.applicationNo}\nExam: ${selectedApplication.examination.code}\nMarks: ${publishedResult.marks}\nPercentage: ${publishedResult.percentage.toFixed(2)}%\nRank: ${publishedResult.rank}\nResult: ${publishedResult.qualified ? "Qualified / Pass" : "Not Qualified / Fail"}`)}
                    >
                      Download Score
                    </Button>
                  )}
                </div>
              </Card>
            </div>

            {/* Attempt Logs History */}
            {candidateAttempts.length > 0 && (
              <Card className="border border-border">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-3">
                  <ListChecks className="text-slate-500" size={18} />
                  <h3 className="font-bold text-slate-800 text-sm">Your Completed Attempt History ({candidateAttempts.length})</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-border text-slate-500 font-bold">
                        <th className="py-2">Attempt #</th>
                        <th className="py-2">Submitted Time</th>
                        <th className="py-2 font-mono">Marks / Score</th>
                        <th className="py-2 font-mono">Percentage</th>
                        <th className="py-2">Grade / Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {candidateAttempts.map((att) => (
                        <tr key={att.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-2.5 font-bold text-slate-800">Attempt #{att.attemptNumber}</td>
                          <td className="py-2.5 text-slate-600 font-mono">{new Date(att.submittedAt).toLocaleString()}</td>
                          <td className="py-2.5 font-bold font-mono text-slate-800">{att.score}</td>
                          <td className="py-2.5 font-bold font-mono text-slate-800">{att.percentage.toFixed(1)}%</td>
                          <td className="py-2.5">
                            <Badge className={att.resultStatus === "PASS" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-destructive/10 text-destructive"}>
                              {att.resultStatus}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </main>
  );
}
