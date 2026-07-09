import { Flag, LogOut, Save, Send } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Button, Card } from "../components/ui";
import { fallbackPhase, type CandidatePhaseSnapshot } from "../lib/workflow";
import { usePersistentState } from "../lib/usePersistentState";
import { api } from "../lib/api";

type OnlineQuestion = {
  id: string;
  number: number;
  subject: string;
  topic: string;
  questionType: string;
  prompt: string;
  difficulty: string;
  marks: number;
  negativeMarks: number;
  options: Array<{ id: string; text: string }>;
};

type OnlinePaper = {
  exam: { id: string; code: string; name: string };
  activePhase?: CandidatePhaseSnapshot["activePhase"];
  access: CandidatePhaseSnapshot["access"];
  questions: OnlineQuestion[];
};

export function OnlineExam() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = usePersistentState("examPortal.onlineExam.v3.currentIndex", 0);
  const [answers, setAnswers] = usePersistentState<Record<string, string>>("examPortal.onlineExam.v3.answers", {});
  const [marked, setMarked] = usePersistentState<string[]>("examPortal.onlineExam.v3.marked", []);
  const [submitted, setSubmitted] = usePersistentState("examPortal.onlineExam.v3.submitted", false);
  const [notice, setNotice] = usePersistentState("examPortal.onlineExam.v3.notice", "Loading database question paper.");
  const [phase, setPhase] = useState<CandidatePhaseSnapshot>(fallbackPhase);
  const [paper, setPaper] = useState<OnlinePaper | null>(null);

  const questions = paper?.questions ?? [];
  const currentQuestion = questions[Math.min(currentIndex, Math.max(questions.length - 1, 0))];
  const attempted = useMemo(() => Object.keys(answers).length, [answers]);
  const sectionCounts = useMemo(() => {
    return questions.reduce<Record<string, number>>((acc, question) => {
      acc[question.subject] = (acc[question.subject] ?? 0) + 1;
      return acc;
    }, {});
  }, [questions]);

  useEffect(() => {
    api<OnlinePaper>("/questions/online/active")
      .then((data) => {
        setPaper(data);
        setPhase({ exam: data.exam, activePhase: data.activePhase, access: data.access });
        setNotice(data.access.onlineExam ? `${data.exam.code} loaded with ${data.questions.length} database questions.` : `Exam locked during ${data.activePhase?.name}.`);
      })
      .catch((error) => setNotice(error instanceof Error ? error.message : "Could not load the online exam paper."));
  }, []);

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  function saveAndNext() {
    if (!phase.access.onlineExam || !currentQuestion) {
      setNotice(`Saving is locked during ${phase.activePhase?.name ?? "the current phase"}.`);
      return;
    }
    setNotice(`Question ${currentQuestion.number || currentIndex + 1} saved.`);
    setCurrentIndex((value) => Math.min(questions.length - 1, value + 1));
  }

  function markForReview() {
    if (!phase.access.onlineExam || !currentQuestion) {
      setNotice(`Review marking is locked during ${phase.activePhase?.name ?? "the current phase"}.`);
      return;
    }
    setMarked((currentMarked) => currentMarked.includes(currentQuestion.id) ? currentMarked.filter((item) => item !== currentQuestion.id) : [...currentMarked, currentQuestion.id]);
    setNotice(`Question ${currentQuestion.number || currentIndex + 1} review flag toggled.`);
  }

  async function submitExam() {
    if (!paper || !phase.access.onlineExam) {
      setNotice(`Submission is locked during ${phase.activePhase?.name ?? "the current phase"}.`);
      return;
    }
    try {
      const result = await api<{ sessionId: string; answered: number }>("/questions/online/submit", {
        method: "POST",
        body: JSON.stringify({ examId: paper.exam.id, answers, marked })
      });
      setSubmitted(true);
      setNotice(`Exam submitted to database. ${result.answered} answer(s) saved.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Exam submission failed.");
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card p-4">
        <div><h1 className="font-bold">{paper?.exam.name ?? "Online Examination"}</h1><p className="text-sm text-slate-500">{paper?.exam.code ?? "Loading"} | {Object.entries(sectionCounts).map(([name, count]) => `${name}: ${count}`).join(" | ")}</p></div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="rounded-md bg-destructive px-4 py-2 font-bold text-white">03:00:00</div>
          <Button className="bg-slate-800" onClick={handleLogout}><LogOut size={18} /> Logout</Button>
        </div>
      </header>
      <div className="border-b border-border bg-card px-4 py-3 text-sm font-medium">{submitted ? "Exam submitted successfully. Attempt summary is locked." : notice}</div>
      <div className="grid gap-4 p-4 lg:grid-cols-[1fr_320px]">
        <Card>
          {!phase.access.onlineExam && <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-800">This exam console is disabled until the admin activates Online Examination.</div>}
          {!currentQuestion ? (
            <div className="rounded-md bg-muted p-4 text-sm font-semibold">No questions are available for the active examination.</div>
          ) : (
            <>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><h2 className="font-semibold">Question {currentQuestion.number || currentIndex + 1}</h2><span className="text-sm text-slate-500">{currentQuestion.subject} | {currentQuestion.topic} | Marks {currentQuestion.marks}, Negative {currentQuestion.negativeMarks}</span></div>
              <p className="mb-5 text-lg font-semibold">{currentQuestion.prompt}</p>
              <div className="space-y-3">{currentQuestion.options.map((option) => <label className={`flex items-center gap-3 rounded-md border border-border p-4 ${answers[currentQuestion.id] === option.id ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950" : ""}`} key={option.id}><input checked={answers[currentQuestion.id] === option.id} disabled={submitted || !phase.access.onlineExam} name="answer" type="radio" onChange={() => { setAnswers((currentAnswers) => ({ ...currentAnswers, [currentQuestion.id]: option.id })); setNotice(`Answer selected for question ${currentQuestion.number || currentIndex + 1}.`); }} />{option.text}</label>)}</div>
              <div className="mt-6 flex flex-wrap gap-2"><Button className="bg-secondary" disabled={submitted || !phase.access.onlineExam} onClick={saveAndNext}><Save size={18} /> Save & Next</Button><Button disabled={submitted || !phase.access.onlineExam} onClick={markForReview}><Flag size={18} /> {marked.includes(currentQuestion.id) ? "Unmark Review" : "Mark For Review"}</Button><Button className="bg-destructive" disabled={submitted || !phase.access.onlineExam} onClick={submitExam}><Send size={18} /> Submit</Button></div>
            </>
          )}
        </Card>
        <Card>
          <h2 className="mb-4 font-semibold">Question Palette</h2>
          <div className="grid grid-cols-5 gap-2">{questions.map((question, index) => <button className={`h-10 rounded-md text-sm font-bold ${index === currentIndex ? "bg-primary text-white" : marked.includes(question.id) ? "bg-amber-500 text-white" : answers[question.id] ? "bg-emerald-600 text-white" : "bg-muted"}`} key={question.id} onClick={() => { setCurrentIndex(index); setNotice(`Question ${question.number || index + 1} opened.`); }}>{question.number || index + 1}</button>)}</div>
          <div className="mt-5 space-y-2 text-sm"><p>Total questions: {questions.length}</p><p>Attempted: {attempted}</p><p>Skipped: {Math.max(questions.length - attempted, 0)}</p><p>Marked for review: {marked.length}</p><p>Submission: {submitted ? "Submitted" : "Not submitted"}</p></div>
        </Card>
      </div>
    </main>
  );
}
