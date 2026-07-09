import { Flag, LogOut, Save, Send } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Button, Card } from "../components/ui";
import { fallbackPhase, getCandidatePhase, type CandidatePhaseSnapshot } from "../lib/workflow";

const numbers = Array.from({ length: 30 }, (_, i) => i + 1);
const options = ["Election Commission", "Union Public Service Commission", "Finance Commission", "Planning Commission"];

export function OnlineExam() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [current, setCurrent] = useState(12);
  const [answers, setAnswers] = useState<Record<number, string>>({ 12: "Union Public Service Commission" });
  const [marked, setMarked] = useState<number[]>([5, 9]);
  const [submitted, setSubmitted] = useState(false);
  const [notice, setNotice] = useState("Question 12 auto-saved just now.");
  const [phase, setPhase] = useState<CandidatePhaseSnapshot>(fallbackPhase);

  const attempted = useMemo(() => Object.keys(answers).length, [answers]);

  useEffect(() => {
    getCandidatePhase()
      .then((snapshot) => {
        setPhase(snapshot);
        setNotice(snapshot.access.onlineExam ? "Online examination phase is active." : `Exam locked during ${snapshot.activePhase?.name}.`);
      })
      .catch(() => setNotice("Using demo phase state because the workflow API is not reachable."));
  }, []);

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  function saveAndNext() {
    if (!phase.access.onlineExam) {
      setNotice(`Saving is locked during ${phase.activePhase?.name}.`);
      return;
    }
    setNotice(`Question ${current} saved.`);
    setCurrent((value) => Math.min(30, value + 1));
  }

  function markForReview() {
    if (!phase.access.onlineExam) {
      setNotice(`Review marking is locked during ${phase.activePhase?.name}.`);
      return;
    }
    setMarked((currentMarked) => currentMarked.includes(current) ? currentMarked.filter((item) => item !== current) : [...currentMarked, current]);
    setNotice(`Question ${current} review flag toggled.`);
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card p-4">
        <div><h1 className="font-bold">National Recruitment Examination</h1><p className="text-sm text-slate-500">Section A: General Studies</p></div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="rounded-md bg-destructive px-4 py-2 font-bold text-white">01:24:36</div>
          <Button className="bg-slate-800" onClick={handleLogout}><LogOut size={18} /> Logout</Button>
        </div>
      </header>
      <div className="border-b border-border bg-card px-4 py-3 text-sm font-medium">{submitted ? "Exam submitted successfully. Attempt summary is locked." : notice}</div>
      <div className="grid gap-4 p-4 lg:grid-cols-[1fr_320px]">
        <Card>
          {!phase.access.onlineExam && <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-800">This exam console is disabled until the admin activates Online Examination.</div>}
          <div className="mb-4 flex items-center justify-between"><h2 className="font-semibold">Question {current}</h2><span className="text-sm text-slate-500">Marks 2, Negative 0.5</span></div>
          <p className="mb-5 text-lg font-semibold">Which constitutional body conducts recruitment examinations for civil services in India?</p>
          <div className="space-y-3">{options.map((option) => <label className={`flex items-center gap-3 rounded-md border border-border p-4 ${answers[current] === option ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950" : ""}`} key={option}><input checked={answers[current] === option} disabled={submitted || !phase.access.onlineExam} name="answer" type="radio" onChange={() => { setAnswers((currentAnswers) => ({ ...currentAnswers, [current]: option })); setNotice(`Answer selected for question ${current}.`); }} />{option}</label>)}</div>
          <div className="mt-6 flex flex-wrap gap-2"><Button className="bg-secondary" disabled={submitted || !phase.access.onlineExam} onClick={saveAndNext}><Save size={18} /> Save & Next</Button><Button disabled={submitted || !phase.access.onlineExam} onClick={markForReview}><Flag size={18} /> {marked.includes(current) ? "Unmark Review" : "Mark For Review"}</Button><Button className="bg-destructive" disabled={submitted || !phase.access.onlineExam} onClick={() => { setSubmitted(true); setNotice("Exam submitted."); }}><Send size={18} /> Submit</Button></div>
        </Card>
        <Card>
          <h2 className="mb-4 font-semibold">Question Palette</h2>
          <div className="grid grid-cols-5 gap-2">{numbers.map((n) => <button className={`h-10 rounded-md text-sm font-bold ${n === current ? "bg-primary text-white" : marked.includes(n) ? "bg-amber-500 text-white" : answers[n] ? "bg-emerald-600 text-white" : "bg-muted"}`} key={n} onClick={() => { setCurrent(n); setNotice(`Question ${n} opened.`); }}>{n}</button>)}</div>
          <div className="mt-5 space-y-2 text-sm"><p>Attempted: {attempted}</p><p>Skipped: {30 - attempted}</p><p>Marked for review: {marked.length}</p><p>Submission: {submitted ? "Submitted" : "Not submitted"}</p></div>
        </Card>
      </div>
    </main>
  );
}
