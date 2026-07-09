import { Download, FileText, LogOut, MonitorPlay, Ticket } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Badge, Button, Card } from "../components/ui";
import { fallbackPhase, getCandidatePhase, type CandidatePhaseSnapshot } from "../lib/workflow";

const timeline = ["Submitted", "Verification", "Approved", "Hall Ticket Released", "Examination", "Evaluation", "Result Published"];

export function CandidateDashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [notice, setNotice] = useState("Welcome back. Hall ticket is ready for download.");
  const [resultVisible, setResultVisible] = useState(false);
  const [timelineIndex, setTimelineIndex] = useState(3);
  const [phase, setPhase] = useState<CandidatePhaseSnapshot>(fallbackPhase);

  useEffect(() => {
    getCandidatePhase()
      .then((snapshot) => {
        setPhase(snapshot);
        const index = timeline.findIndex((item) => snapshot.activePhase?.name.toLowerCase().includes(item.toLowerCase().split(" ")[0]));
        setTimelineIndex(index >= 0 ? index : 0);
        setNotice(`${snapshot.exam.name}: active phase is ${snapshot.activePhase?.name ?? "Not scheduled"}.`);
      })
      .catch(() => setNotice("Using demo phase state because the workflow API is not reachable."));
  }, []);

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

  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-5">
        <Card className="border-l-4 border-l-primary py-3 text-sm font-medium">{notice}</Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h1 className="text-2xl font-bold">Candidate Dashboard</h1><p className="text-sm text-slate-500">Current examination phase, application timeline, downloads, and result access.</p></div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-emerald-50 text-emerald-700">Current Phase: {phase.activePhase?.name ?? "Loading"}</Badge>
            <Button className="bg-destructive" onClick={handleLogout}><LogOut size={18} /> Logout</Button>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-4">{["Application Approved", "Documents Verified", "Hall Ticket Ready", "Exam on 12 Aug"].map((item) => <Card key={item}><p className="font-semibold">{item}</p></Card>)}</div>
        <Card><h2 className="mb-4 font-semibold">Application Timeline</h2><div className="grid gap-2 md:grid-cols-7">{timeline.map((item, i) => <button className={`rounded-md border border-border p-3 text-left ${i === timelineIndex ? "bg-primary text-white" : ""}`} key={item} onClick={() => { setTimelineIndex(i); setNotice(`${item} timeline stage opened.`); }}><Badge>{i <= timelineIndex ? "Done" : "Pending"}</Badge><p className="mt-2 text-sm font-semibold">{item}</p></button>)}</div></Card>
        <div className="grid gap-4 md:grid-cols-3">
          <Card><Ticket className="mb-3 text-primary" /><h2 className="font-semibold">Hall Ticket</h2><p className="my-3 text-sm text-slate-500">{phase.access.hallTicket ? "Roll No 26000012, Centre Pune Digital Campus." : `Locked during ${phase.activePhase?.name}.`}</p><Button disabled={!phase.access.hallTicket && !phase.access.archiveDownloads} onClick={() => { downloadFile("hall-ticket.txt", "Hall Ticket\nRoll No: 26000012\nCentre: Pune Digital Campus"); setNotice("Hall ticket downloaded."); }}><Download size={18} /> Download PDF</Button></Card>
          <Card><MonitorPlay className="mb-3 text-secondary" /><h2 className="font-semibold">Online Examination</h2><p className="my-3 text-sm text-slate-500">{phase.access.onlineExam ? "Exam console is enabled for the active phase." : `Exam locked during ${phase.activePhase?.name}.`}</p><div className="flex flex-wrap gap-2"><Button className="bg-secondary" disabled={!phase.access.onlineExam} onClick={() => setNotice("System check passed. Browser, keyboard, and timer are ready.")}>System Check</Button>{phase.access.onlineExam ? <Link to="/exam"><Button>Open Exam Console</Button></Link> : <Button disabled>Open Exam Console</Button>}</div></Card>
          <Card><FileText className="mb-3 text-amber-600" /><h2 className="font-semibold">Result</h2><p className="my-3 text-sm text-slate-500">{resultVisible ? "Marks 146/200, Rank 42, Qualified." : phase.access.result ? "Result is published and ready." : `Result locked during ${phase.activePhase?.name}.`}</p><div className="flex flex-wrap gap-2"><Button disabled={!phase.access.result && !phase.access.archiveDownloads} onClick={() => { setResultVisible(true); setTimelineIndex(6); setNotice("Result opened and timeline updated."); }}>View Result</Button>{resultVisible && <Button className="bg-secondary" onClick={() => downloadFile("score-card.txt", "Score Card\nMarks: 146/200\nRank: 42\nQualified: Yes")}>Download</Button>}</div></Card>
        </div>
      </div>
    </main>
  );
}
