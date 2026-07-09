import { Download, FileText, LogOut, MonitorPlay, Ticket } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Badge, Button, Card } from "../components/ui";

const timeline = ["Submitted", "Verification", "Approved", "Hall Ticket Released", "Examination", "Evaluation", "Result Published"];

export function CandidateDashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h1 className="text-2xl font-bold">Candidate Dashboard</h1><p className="text-sm text-slate-500">Current examination phase, application timeline, downloads, and result access.</p></div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-emerald-50 text-emerald-700">Current Phase: Hall Ticket Release</Badge>
            <Button className="bg-destructive" onClick={handleLogout}><LogOut size={18} /> Logout</Button>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-4">{["Application Approved", "Documents Verified", "Hall Ticket Ready", "Exam on 12 Aug"].map((item) => <Card key={item}><p className="font-semibold">{item}</p></Card>)}</div>
        <Card><h2 className="mb-4 font-semibold">Application Timeline</h2><div className="grid gap-2 md:grid-cols-7">{timeline.map((item, i) => <div className="rounded-md border border-border p-3" key={item}><Badge>{i < 4 ? "Done" : "Pending"}</Badge><p className="mt-2 text-sm font-semibold">{item}</p></div>)}</div></Card>
        <div className="grid gap-4 md:grid-cols-3">
          <Card><Ticket className="mb-3 text-primary" /><h2 className="font-semibold">Hall Ticket</h2><p className="my-3 text-sm text-slate-500">Roll No 26000012, Centre Pune Digital Campus.</p><Button><Download size={18} /> Download PDF</Button></Card>
          <Card><MonitorPlay className="mb-3 text-secondary" /><h2 className="font-semibold">Online Examination</h2><p className="my-3 text-sm text-slate-500">System check and countdown available before exam.</p><Link to="/exam"><Button className="bg-secondary">Open Exam Console</Button></Link></Card>
          <Card><FileText className="mb-3 text-amber-600" /><h2 className="font-semibold">Result</h2><p className="my-3 text-sm text-slate-500">Score card will appear after result publication.</p><Button>View Result</Button></Card>
        </div>
      </div>
    </main>
  );
}
