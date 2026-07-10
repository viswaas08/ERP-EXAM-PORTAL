import { Flag, LogOut, Save, Send } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  exam: {
    id: string;
    code: string;
    name: string;
    examName?: string;
    examCode?: string;
    durationMinutes: number;
    maximumAttempts: number;
    allowResume: boolean;
    totalQuestions?: number;
    totalMarks?: number;
    passingMarks?: number;
    negativeMarkingEnabled?: boolean;
    negativeMarks?: number;
    instructions?: string;
    status?: string;
  };
  activePhase?: CandidatePhaseSnapshot["activePhase"];
  access: CandidatePhaseSnapshot["access"];
  questions: OnlineQuestion[];
};

type OnlineStartResponse = {
  sessionId: string;
  startedAt: string;
  submitted: boolean;
  resumed?: boolean;
};

type DashboardData = {
  attempts: Array<{ id: string; attemptNumber: number; score: number }>;
};

function formatClock(totalSeconds: number) {
  const safe = Math.max(0, totalSeconds);
  const hours = String(Math.floor(safe / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((safe % 3600) / 60)).padStart(2, "0");
  const seconds = String(safe % 60).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

export function OnlineExam() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [marked, setMarked] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [examStarted, setExamStarted] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [startedAt, setStartedAt] = useState("");
  const [notice, setNotice] = useState("Loading question paper...");
  const [phase, setPhase] = useState<CandidatePhaseSnapshot>(fallbackPhase);
  const [paper, setPaper] = useState<OnlinePaper | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [completedAttemptsCount, setCompletedAttemptsCount] = useState(0);

  const questions = paper?.questions ?? [];
  const currentQuestion = questions[Math.min(currentIndex, Math.max(questions.length - 1, 0))];
  const attempted = useMemo(() => Object.keys(answers).length, [answers]);
  const sectionCounts = useMemo(() => {
    return questions.reduce<Record<string, number>>((acc, question) => {
      acc[question.subject] = (acc[question.subject] ?? 0) + 1;
      return acc;
    }, {});
  }, [questions]);

  // Load Paper and Attempts
  const loadPaperAndAttempts = () => {
    api<OnlinePaper>("/questions/online/active")
      .then((data) => {
        setPaper(data);
        setPhase({ exam: data.exam, activePhase: data.activePhase, access: data.access });
        
        const examId = data.exam.id;
        const prefix = `examPortal.onlineExam.v3.${examId}.`;
        
        setCurrentIndex(Number(localStorage.getItem(prefix + "currentIndex") || "0"));
        setAnswers(JSON.parse(localStorage.getItem(prefix + "answers") || "{}"));
        setMarked(JSON.parse(localStorage.getItem(prefix + "marked") || "[]"));
        setSubmitted(localStorage.getItem(prefix + "submitted") === "true");
        setExamStarted(localStorage.getItem(prefix + "started") === "true");
        setSessionId(localStorage.getItem(prefix + "sessionId") || "");
        setStartedAt(localStorage.getItem(prefix + "startedAt") || "");

        // Fetch dashboard data for attempts count
        api<DashboardData>(`/candidate/dashboard?examId=${encodeURIComponent(examId)}`)
          .then((dash) => {
            const count = dash.attempts?.length ?? 0;
            setCompletedAttemptsCount(count);

            if (!data.access.onlineExam) {
              setNotice(`Exam console is currently locked during ${data.activePhase?.name ?? "the current phase"}.`);
            } else if (count >= data.exam.maximumAttempts) {
              setNotice(`You have completed the maximum allowed ${data.exam.maximumAttempts} attempt(s) for this exam.`);
            } else {
              setNotice(`Question paper loaded. Ready for Attempt #${count + 1} of ${data.exam.maximumAttempts}.`);
            }
          })
          .catch(() => {
            setNotice("Could not load candidate attempt logs.");
          });
      })
      .catch((error) => setNotice(error instanceof Error ? error.message : "Could not load the online exam paper."));
  };

  useEffect(() => {
    if (!paper) return;
    const examId = paper.exam.id;
    const prefix = `examPortal.onlineExam.v3.${examId}.`;
    localStorage.setItem(prefix + "currentIndex", String(currentIndex));
    localStorage.setItem(prefix + "answers", JSON.stringify(answers));
    localStorage.setItem(prefix + "marked", JSON.stringify(marked));
    localStorage.setItem(prefix + "submitted", String(submitted));
    localStorage.setItem(prefix + "started", String(examStarted));
    localStorage.setItem(prefix + "sessionId", sessionId);
    localStorage.setItem(prefix + "startedAt", startedAt);
  }, [paper, currentIndex, answers, marked, submitted, examStarted, sessionId, startedAt]);

  useEffect(() => {
    loadPaperAndAttempts();
  }, []);

  // Poll phase status in real-time (every 1.5 seconds)
  useEffect(() => {
    if (examStarted) return; // Stop polling while taking exam to avoid disruptions
    const timer = setInterval(() => {
      api<OnlinePaper>("/questions/online/active")
        .then((data) => {
          setPhase({ exam: data.exam, activePhase: data.activePhase, access: data.access });
          setPaper(data);
        })
        .catch(() => undefined);
    }, 1500);
    return () => clearInterval(timer);
  }, [examStarted]);

  useEffect(() => {
    if (!paper || !examStarted || !startedAt || submitted) {
      setRemainingSeconds(paper ? paper.exam.durationMinutes * 60 : 0);
      return undefined;
    }

    const updateClock = () => {
      const end = new Date(startedAt).getTime() + paper.exam.durationMinutes * 60 * 1000;
      const rem = Math.max(0, Math.ceil((end - Date.now()) / 1000));
      setRemainingSeconds(rem);
      if (rem <= 0 && !submitted) {
        void submitExam();
      }
    };

    updateClock();
    const timer = window.setInterval(updateClock, 1000);
    return () => window.clearInterval(timer);
  }, [paper, examStarted, startedAt, submitted]);

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  async function startExam() {
    if (!paper || !phase.access.onlineExam) {
      setNotice(`Exam start is locked during ${phase.activePhase?.name ?? "the current phase"}.`);
      return;
    }

    if (completedAttemptsCount >= paper.exam.maximumAttempts) {
      setNotice(`Attempt limit reached (${paper.exam.maximumAttempts}). You cannot take this exam again.`);
      return;
    }

    try {
      const started = await api<OnlineStartResponse>("/questions/online/start", {
        method: "POST",
        body: JSON.stringify({ examId: paper.exam.id })
      });

      setSessionId(started.sessionId);
      setStartedAt(started.startedAt);
      setExamStarted(true);
      setSubmitted(false);

      if (started.resumed) {
        setNotice("Exam session resumed from your previous session.");
      } else {
        // Clear local answer cache on fresh start
        setAnswers({});
        setMarked([]);
        setCurrentIndex(0);
        setNotice(`Attempt #${completedAttemptsCount + 1} started. Timer is running.`);
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Exam could not be started.");
    }
  }

  function saveAndNext() {
    if (!currentQuestion) {
      setNotice("No question is available to save.");
      return;
    }
    if (submitted) {
      setNotice("This exam has already been submitted and is read only.");
      return;
    }
    if (!examStarted) {
      setNotice("Start the exam before saving answers.");
      return;
    }
    setNotice(`Question ${currentQuestion.number || currentIndex + 1} saved.`);
    setCurrentIndex((value) => Math.min(questions.length - 1, value + 1));
  }

  function markForReview() {
    if (!currentQuestion) {
      setNotice("No question is available to mark.");
      return;
    }
    if (submitted) {
      setNotice("This exam has already been submitted and is read only.");
      return;
    }
    if (!examStarted) {
      setNotice("Start the exam before marking questions.");
      return;
    }
    setMarked((currentMarked) => currentMarked.includes(currentQuestion.id) ? currentMarked.filter((item) => item !== currentQuestion.id) : [...currentMarked, currentQuestion.id]);
    setNotice(`Question ${currentQuestion.number || currentIndex + 1} review flag toggled.`);
  }

  async function submitExam() {
    if (!paper) {
      setNotice("No paper is loaded for submission.");
      return;
    }
    if (submitted) {
      setNotice("This exam has already been submitted.");
      return;
    }
    if (!examStarted) {
      setNotice("Start the exam before submitting.");
      return;
    }
    try {
      const result = await api<{ sessionId: string; attemptNumber: number; score: number; percentage: number; answered: number }>("/questions/online/submit", {
        method: "POST",
        body: JSON.stringify({ examId: paper.exam.id, sessionId, answers, marked })
      });
      setSessionId(result.sessionId);
      setSubmitted(true);
      setExamStarted(false);
      setRemainingSeconds(0);
      setCompletedAttemptsCount(result.attemptNumber);
      setNotice(`Attempt #${result.attemptNumber} submitted successfully! Score: ${result.score} (${result.percentage.toFixed(1)}%).`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Exam submission failed.");
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card p-4">
        <div>
          <h1 className="font-bold text-lg text-slate-900">{paper?.exam.examName || paper?.exam.name || "Online Examination"}</h1>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            {paper?.exam.examCode || paper?.exam.code || "Loading"} | {Object.entries(sectionCounts).map(([name, count]) => `${name}: ${count}`).join(" | ")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <div className={`rounded-md px-4 py-2 font-bold font-mono text-white text-sm shadow-sm ${remainingSeconds <= 300 && examStarted ? "bg-destructive animate-pulse" : "bg-slate-800"}`}>
            {formatClock(remainingSeconds || (paper?.exam.durationMinutes ?? 0) * 60)}
          </div>
          <Button className="bg-slate-800 h-9" onClick={handleLogout}><LogOut size={16} /> Logout</Button>
        </div>
      </header>
      <div className="border-b border-border bg-muted/30 px-4 py-3 text-sm font-semibold text-primary">{notice}</div>

      <div className="grid gap-4 p-4 lg:grid-cols-[1fr_320px]">
        <Card className="border border-border">
          {!phase.access.onlineExam && (
            <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3.5 text-xs font-semibold text-amber-800">
              Exam console is locked. Wait for the examination phase to change or the administrator to open access.
            </div>
          )}

          {!examStarted && !submitted ? (
            <div className="rounded-md border border-border bg-slate-50 p-6 space-y-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Examination Instructions</h2>
                <div className="text-xs text-slate-600 mt-2 space-y-1.5 leading-relaxed bg-white border border-border p-4 rounded-md whitespace-pre-wrap">
                  {paper?.exam.instructions || "1. Ensure you have a stable internet connection.\n2. Do not refresh or close the page.\n3. The duration is fixed and answers are evaluated automatically."}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-medium text-slate-700 bg-slate-100 p-3 rounded-md">
                <div>Duration: <strong className="text-slate-900">{paper?.exam.durationMinutes} Minutes</strong></div>
                <div>Maximum Attempts: <strong className="text-slate-950">{paper?.exam.maximumAttempts}</strong></div>
                <div>Completed Attempts: <strong className="text-slate-950">{completedAttemptsCount}</strong></div>
                <div>Remaining Attempts: <strong className="text-emerald-700">{Math.max(0, (paper?.exam.maximumAttempts || 1) - completedAttemptsCount)}</strong></div>
              </div>

              <div className="flex flex-wrap gap-2.5 pt-2">
                <Button
                  className="bg-emerald-600 shadow-md hover:opacity-90"
                  disabled={!phase.access.onlineExam || completedAttemptsCount >= (paper?.exam.maximumAttempts || 1)}
                  onClick={startExam}
                >
                  Start Attempt #{completedAttemptsCount + 1}
                </Button>
                <Link to="/candidate">
                  <Button className="bg-slate-100 text-slate-700 hover:bg-slate-200">Back to Dashboard</Button>
                </Link>
              </div>
            </div>
          ) : !currentQuestion ? (
            <div className="rounded-md bg-muted p-4 text-sm font-semibold text-slate-500">No questions are available in the question paper.</div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
                <h2 className="font-bold text-slate-800 text-base">Question {currentQuestion.number || currentIndex + 1}</h2>
                <span className="text-xs font-semibold bg-slate-100 px-2.5 py-1 rounded text-slate-600">
                  {currentQuestion.subject} · {currentQuestion.topic} · Marks {currentQuestion.marks} (Neg -{currentQuestion.negativeMarks})
                </span>
              </div>
              <p className="text-lg font-bold text-slate-900 leading-snug whitespace-pre-wrap">{currentQuestion.prompt}</p>

              <div className="space-y-3.5 pt-2">
                {currentQuestion.options.map((option) => (
                  <label
                    className={`flex items-center gap-3.5 rounded-md border p-4 cursor-pointer transition-all ${answers[currentQuestion.id] === option.id ? "bg-emerald-50/50 border-emerald-400 text-emerald-900 font-semibold" : "border-border hover:bg-slate-50"}`}
                    key={option.id}
                  >
                    <input
                      checked={answers[currentQuestion.id] === option.id}
                      className="h-4.5 w-4.5 border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      disabled={submitted || !examStarted}
                      name="answer"
                      type="radio"
                      onChange={() => {
                        setAnswers((currentAnswers) => ({ ...currentAnswers, [currentQuestion.id]: option.id }));
                        setNotice(`Selected option for question ${currentQuestion.number || currentIndex + 1}.`);
                      }}
                    />
                    {option.text}
                  </label>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap gap-2 pt-4 border-t border-slate-100">
                <Button className="bg-emerald-600 shadow-sm" disabled={submitted || !examStarted} onClick={saveAndNext}>
                  Save & Next
                </Button>
                <Button className="bg-slate-100 text-slate-700 hover:bg-slate-200" disabled={submitted || !examStarted} onClick={markForReview}>
                  {marked.includes(currentQuestion.id) ? "Unmark Review" : "Mark For Review"}
                </Button>
                <Button className="bg-destructive hover:opacity-90 ml-auto" disabled={submitted || !examStarted} onClick={submitExam}>
                  Submit Attempt
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Palette Card */}
        <Card className="border border-border">
          <h2 className="mb-4 font-bold text-slate-900 text-sm tracking-tight border-b border-slate-100 pb-2">Question Palette</h2>
          <div className="grid grid-cols-5 gap-2.5 max-h-[350px] overflow-y-auto pr-1">
            {questions.map((question, index) => (
              <button
                className={`h-9 rounded-md text-xs font-bold font-mono transition-all ${submitted ? "bg-muted text-slate-400 cursor-not-allowed" : index === currentIndex ? "bg-primary text-white scale-[1.05]" : marked.includes(question.id) ? "bg-amber-500 text-white" : answers[question.id] ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                key={question.id}
                disabled={!examStarted || submitted}
                onClick={() => {
                  setCurrentIndex(index);
                  setNotice(`Question ${question.number || index + 1} opened.`);
                }}
              >
                {question.number || index + 1}
              </button>
            ))}
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 space-y-2 text-xs font-medium text-slate-600">
            <div className="flex justify-between"><span>Total Questions</span><span className="font-bold text-slate-800">{questions.length}</span></div>
            <div className="flex justify-between"><span>Attempted</span><span className="font-bold text-emerald-600">{attempted}</span></div>
            <div className="flex justify-between"><span>Skipped</span><span className="font-bold text-slate-800">{Math.max(questions.length - attempted, 0)}</span></div>
            <div className="flex justify-between"><span>Marked for Review</span><span className="font-bold text-amber-600">{marked.length}</span></div>
          </div>

          {submitted && (
            <div className="mt-5 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 leading-relaxed font-semibold">
              Attempt completed. You can safely return to the dashboard to review your results or start another attempt if allowed.
            </div>
          )}
        </Card>
      </div>
    </main>
  );
}
