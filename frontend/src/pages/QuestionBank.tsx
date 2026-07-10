import { BookOpenCheck, FileText, Image, Layers, Plus, Shuffle, Copy, CheckCircle, HelpCircle, ArrowRightLeft } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, Input, Select, Table } from "../components/ui";
import { usePersistentState } from "../lib/usePersistentState";
import { api } from "../lib/api";

type QuestionRow = {
  id?: string;
  prompt: string;
  questionType: string;
  difficulty: string;
  marks: number;
  negativeMarks: number;
  tags: string[];
  subject: { name: string };
  topic: { name: string };
  bank?: { name: string; exam: { code: string; name: string } };
  options?: Array<{ id: string; text: string; isCorrect: boolean }>;
};

type RawQuestionRow = Partial<QuestionRow> & Record<string, unknown>;

type QuestionBankSummary = {
  id: string;
  name: string;
  exam: { id: string; code: string; name: string } | null;
  _count?: { questions: number };
};

type ExamOption = {
  id: string;
  code: string;
  name: string;
  examName?: string;
  examCode?: string;
  subject?: string;
};

const subjectOptions = ["General Studies", "Aptitude", "Mathematics", "Computer", "English", "Maths", "Chemistry", "Physics", "Reasoning", "Current Affairs", "Domain Knowledge"];
const difficulties = ["All Difficulties", "Easy", "Medium", "Hard", "Expert"];
const questionTypes = ["All Types", "MCQ", "Multiple Select", "Numerical", "True False", "Image MCQ", "Comprehension", "Assertion Reason"];

function questionNumber(tags: string[]) {
  const tag = tags.find((item) => /^Q\d+$/.test(item));
  return tag ? Number(tag.slice(1)) : 0;
}

function normalizeQuestionRow(row: RawQuestionRow, index: number): QuestionRow {
  const subject = typeof row.subject === "object" && row.subject !== null && "name" in row.subject ? row.subject as { name?: unknown } : undefined;
  const topic = typeof row.topic === "object" && row.topic !== null && "name" in row.topic ? row.topic as { name?: unknown } : undefined;
  const tags = Array.isArray(row.tags) ? row.tags.filter((tag): tag is string => typeof tag === "string") : [];
  const options = Array.isArray(row.options)
    ? row.options.map((option, optionIndex) => {
        const item = option as { id?: unknown; text?: unknown; isCorrect?: unknown };
        return {
          id: typeof item.id === "string" ? item.id : `option-${index}-${optionIndex}`,
          text: typeof item.text === "string" ? item.text : `Option ${optionIndex + 1}`,
          isCorrect: Boolean(item.isCorrect)
        };
      })
    : undefined;

  return {
    id: typeof row.id === "string" ? row.id : undefined,
    prompt: typeof row.prompt === "string" && row.prompt.trim() ? row.prompt : `Untitled question ${index + 1}`,
    subject: { name: typeof subject?.name === "string" && subject.name.trim() ? subject.name : "General Studies" },
    topic: { name: typeof topic?.name === "string" && topic.name.trim() ? topic.name : "General" },
    questionType: typeof row.questionType === "string" && row.questionType.trim() ? row.questionType : "MCQ",
    difficulty: typeof row.difficulty === "string" && row.difficulty.trim() ? row.difficulty : "Medium",
    marks: Number.isFinite(Number(row.marks)) ? Number(row.marks) : 2,
    negativeMarks: Number.isFinite(Number(row.negativeMarks)) ? Number(row.negativeMarks) : 0,
    tags: tags.length ? tags : [`Q${index + 1}`],
    bank: row.bank,
    options
  };
}

function normalizeQuestionRows(value: unknown): QuestionRow[] {
  if (!Array.isArray(value)) return [];
  return value.map((row, index) => normalizeQuestionRow((row ?? {}) as RawQuestionRow, index));
}

export function QuestionBank() {
  const [rows, setRows] = useState<QuestionRow[]>([]);
  const [notice, setNotice] = useState("Question bank ready.");
  const [paperCount, setPaperCount] = useState(0);
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("All Subjects");
  const [difficulty, setDifficulty] = useState("All Difficulties");
  const [type, setType] = useState("All Types");
  const [examFilter, setExamFilter] = useState("All Exams");

  // Selection states
  const [selectedExamId, setSelectedExamId] = usePersistentState<string | undefined>("examPortal.examinations.selectedExamId", undefined);
  const [banks, setBanks] = useState<QuestionBankSummary[]>([]);
  const [exams, setExams] = useState<ExamOption[]>([]);
  const [selectedBankId, setSelectedBankId] = useState("");
  const [sourceBankId, setSourceBankId] = useState("");

  // Create Question State
  const [draftPrompt, setDraftPrompt] = useState("");
  const [draftSubject, setDraftSubject] = useState("General Studies");
  const [draftTopic, setDraftTopic] = useState("General");
  const [draftDifficulty, setDraftDifficulty] = useState("Medium");
  const [draftType, setDraftType] = useState("MCQ");

  async function loadQuestions(bankId = selectedBankId) {
    if (!bankId) {
      setRows([]);
      return;
    }
    try {
      const data = await api<QuestionRow[]>(`/questions/bank?bankId=${encodeURIComponent(bankId)}`);
      setRows(normalizeQuestionRows(data));
      setNotice(`${data.length} question(s) loaded from the selected bank.`);
    } catch {
      setNotice("Could not load database questions. Select a different question bank.");
    }
  }

  async function loadBanks() {
    try {
      const data = await api<QuestionBankSummary[]>("/questions/banks");
      setBanks(data);
      if (data.length > 0) {
        setSelectedBankId((current) => data.some((bank) => bank.id === current) ? current : data[0].id);
        setSourceBankId((current) => data.some((bank) => bank.id === current) ? current : data[0].id);
      }
    } catch {
      setNotice("Could not load question banks.");
    }
  }

  async function loadExams() {
    try {
      const data = await api<ExamOption[]>("/examinations");
      setExams(data);
      if (data.length > 0 && !selectedExamId) {
        setSelectedExamId(data[0].id);
      }
    } catch {
      setNotice("Could not load examinations.");
    }
  }

  useEffect(() => {
    void loadBanks();
    void loadExams();
  }, []);

  useEffect(() => {
    void loadQuestions();
  }, [selectedBankId]);

  const safeRows = useMemo(() => normalizeQuestionRows(rows), [rows]);

  const filteredRows = useMemo(() => {
    const searchText = String(search ?? "").toLowerCase();
    return safeRows.filter((q) => {
      const textMatch = q.prompt.toLowerCase().includes(searchText);
      const subjectMatch = subject === "All Subjects" || q.subject.name === subject;
      const difficultyMatch = difficulty === "All Difficulties" || q.difficulty === difficulty;
      const typeMatch = type === "All Types" || q.questionType === type;
      const examMatch = examFilter === "All Exams" || q.bank?.exam?.code === examFilter;
      return textMatch && subjectMatch && difficultyMatch && typeMatch && examMatch;
    });
  }, [safeRows, search, subject, difficulty, type, examFilter]);

  const subjects = useMemo(() => ["All Subjects", ...Array.from(new Set([...subjectOptions, ...safeRows.map((q) => q.subject.name)])).sort()], [safeRows]);
  const examCodes = useMemo(() => Array.from(new Set(banks.map((bank) => bank.exam?.code).filter(Boolean))), [banks]);
  const totalMarks = safeRows.reduce((sum, q) => sum + Number(q.marks || 0), 0);
  const selectedBank = banks.find((bank) => bank.id === selectedBankId) ?? null;
  const targetExam = exams.find((exam) => exam.id === selectedExamId) ?? null;

  async function importBank() {
    if (!sourceBankId) {
      setNotice("Choose a source question bank to copy questions from.");
      return;
    }

    if (!selectedExamId) {
      setNotice("Select a target examination to import the questions into.");
      return;
    }

    try {
      const imported = await api<QuestionBankSummary>("/questions/banks/import", {
        method: "POST",
        body: JSON.stringify({ sourceBankId, targetExamId: selectedExamId })
      });
      setBanks((current) => [imported, ...current.filter((bank) => bank.id !== imported.id)]);
      setSelectedBankId(imported.id);
      setNotice(`Imported ${imported.name} successfully into ${imported.exam?.code || "target exam"}.`);
      await loadQuestions(imported.id);
      await loadBanks();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not import the question bank.");
    }
  }

  async function assignBank() {
    if (!sourceBankId) {
      setNotice("Choose a question bank to assign.");
      return;
    }

    if (!selectedExamId) {
      setNotice("Select a target examination for assignment.");
      return;
    }

    try {
      const updated = await api<QuestionBankSummary>(`/questions/banks/${sourceBankId}/assign`, {
        method: "PATCH",
        body: JSON.stringify({ targetExamId: selectedExamId })
      });
      setBanks((current) => current.map((bank) => bank.id === updated.id ? updated : bank));
      setSelectedBankId(updated.id);
      setNotice(`Assigned bank "${updated.name}" successfully to ${updated.exam?.code || "target exam"}.`);
      await loadQuestions(updated.id);
      await loadBanks();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not assign the question bank.");
    }
  }

  async function unassignBank(bankId: string) {
    try {
      const updated = await api<QuestionBankSummary>(`/questions/banks/${bankId}/assign`, {
        method: "PATCH",
        body: JSON.stringify({ targetExamId: "" })
      });
      setBanks((current) => current.map((bank) => bank.id === updated.id ? { ...bank, exam: null } : bank));
      setNotice(`Unassigned bank "${updated.name}" successfully.`);
      await loadBanks();
      if (selectedBankId === bankId) {
        await loadQuestions(bankId);
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not unassign the question bank.");
    }
  }

  async function promptAssignBank(bankId: string) {
    const examCodesList = exams.map((e) => e.code).join(", ");
    const targetCode = prompt(`Available Exams: ${examCodesList}\n\nEnter the exam code to assign this bank to:`);
    if (!targetCode) return;

    const trimmed = targetCode.trim();
    const foundExam = exams.find((e) => e.code.toLowerCase() === trimmed.toLowerCase());
    if (!foundExam) {
      alert(`Invalid exam code: "${trimmed}". Please choose from: ${examCodesList}`);
      return;
    }

    try {
      const updated = await api<QuestionBankSummary>(`/questions/banks/${bankId}/assign`, {
        method: "PATCH",
        body: JSON.stringify({ targetExamId: foundExam.id })
      });
      setBanks((current) => current.map((bank) => bank.id === updated.id ? updated : bank));
      setNotice(`Assigned bank "${updated.name}" successfully to ${updated.exam?.code || "target exam"}.`);
      await loadBanks();
      if (selectedBankId === bankId) {
        await loadQuestions(bankId);
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not assign the question bank.");
    }
  }

  async function addQuestion() {
    if (!selectedBankId) {
      setNotice("Select a question bank before creating a question.");
      return;
    }
    const prompt = draftPrompt.trim();
    if (!prompt) {
      setNotice("Please write a question prompt.");
      return;
    }

    try {
      const payload = {
        bankId: selectedBankId,
        subject: draftSubject,
        topic: draftTopic.trim() || "General",
        questionType: draftType,
        difficulty: draftDifficulty,
        prompt,
        explanation: "Auto generated explanation",
        marks: 2,
        negativeMarks: 0.5,
        options: [
          { text: "Option A", isCorrect: true },
          { text: "Option B", isCorrect: false },
          { text: "Option C", isCorrect: false },
          { text: "Option D", isCorrect: false }
        ]
      };

      await api("/questions", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      setDraftPrompt("");
      setDraftTopic("General");
      setNotice("Question successfully created and saved to bank.");
      await loadQuestions();
      await loadBanks();
    } catch (err) {
      setNotice("Failed to add question to database.");
    }
  }

  function generatePaper() {
    setPaperCount((value) => value + 1);
    setNotice(`Random question paper #${paperCount + 1} generated from ${safeRows.length} question(s).`);
  }

  return (
    <section className="space-y-6">
      {/* Notice Banner */}
      <Card className="border-l-4 border-l-primary py-3 text-sm font-semibold bg-primary/5 text-primary flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
        {notice}
      </Card>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Question Registry</h1>
          <p className="text-slate-500 mt-1">Map, import, and draft questions assigned to competitive university examinations.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button className="bg-slate-700" onClick={() => {
            setSearch("");
            setSubject("All Subjects");
            setDifficulty("All Difficulties");
            setType("All Types");
            setExamFilter("All Exams");
            setNotice("Filters reset.");
          }}>Reset Filters</Button>
          <Button className="bg-indigo-600 hover:opacity-90" onClick={generatePaper}><Shuffle size={16} /> Generate Mock Paper</Button>
        </div>
      </div>

      {/* Grid of Available Question Banks with Assigned Exam details */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-3.5">Assigned Question Banks & Examinations</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {banks.map((bank) => (
            <Card
              className={`border transition-all cursor-pointer relative flex flex-col justify-between ${selectedBankId === bank.id ? "border-primary bg-primary/5 shadow-md scale-[1.01]" : "border-border hover:bg-slate-50/50"}`}
              key={bank.id}
              onClick={() => setSelectedBankId(bank.id)}
            >
              <div>
                <div className="flex items-center justify-between gap-1.5 mb-2.5">
                  <Badge className="font-mono text-[9px] bg-slate-100 font-semibold">{bank.exam?.code || "No Exam"}</Badge>
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 font-mono text-[9px]">
                    {bank._count?.questions ?? 0} Qs
                  </Badge>
                </div>
                <h3 className="font-bold text-sm text-slate-800 line-clamp-1">{bank.name}</h3>
                <p className="text-[10px] text-slate-500 mt-1.5 line-clamp-2">
                  Assigned to: <strong className="text-slate-700 font-medium">{bank.exam?.name || "Unassigned"}</strong>
                </p>
              </div>

              <div className="border-t border-slate-100 pt-2.5 mt-3 text-[10px] flex justify-between items-center text-slate-500">
                <span className="flex items-center gap-1">
                  Active Bank
                  {selectedBankId === bank.id && <CheckCircle size={13} className="text-primary" />}
                </span>
                {!bank.exam ? (
                  <button
                    className="text-indigo-600 hover:text-indigo-800 hover:underline font-semibold text-[10px] transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      void promptAssignBank(bank.id);
                    }}
                  >
                    Assign
                  </button>
                ) : (
                  <button
                    className="text-rose-600 hover:text-rose-800 hover:underline font-semibold text-[10px] transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      void unassignBank(bank.id);
                    }}
                  >
                    Unassign
                  </button>
                )}
              </div>
            </Card>
          ))}
          {!banks.length && (
            <div className="col-span-full text-center py-10 text-slate-400 border-2 border-dashed rounded-lg">
              No question banks found. Please create an examination first.
            </div>
          )}
        </div>
      </div>

      {/* Target selector and Import engine */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Dynamic target exam selection & import */}
        <Card className="border border-border space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <ArrowRightLeft className="text-indigo-600" size={18} />
            <h2 className="font-bold text-slate-900 text-sm">Copy & Import Question Bank</h2>
          </div>

          <div className="space-y-3.5 text-xs">
            <div>
              <label className="block font-semibold text-slate-600 mb-1">1. Choose Source Question Bank (From Existing)</label>
              <Select value={sourceBankId} onChange={(e) => setSourceBankId(e.target.value)}>
                <option value="">Select source bank...</option>
                {banks.map((bank) => (
                  <option key={bank.id} value={bank.id}>
                    {bank.exam?.code || "Unassigned"} - {bank.name} ({bank._count?.questions ?? 0} Questions)
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">2. Select Target Examination (To Import Into)</label>
              <Select value={selectedExamId || ""} onChange={(e) => setSelectedExamId(e.target.value)}>
                <option value="">Choose target exam...</option>
                {exams.map((exam) => (
                  <option key={exam.id} value={exam.id}>
                    {exam.code} - {exam.examName || exam.name} ({exam.subject || "No Subject"})
                  </option>
                ))}
              </Select>
            </div>

            <div className="bg-slate-50 p-3 rounded-md border border-slate-100 flex flex-col gap-1">
              <span className="text-[10px] text-slate-400 font-medium">Selected Target Summary:</span>
              <span className="font-bold text-slate-700">
                {targetExam ? `${targetExam.code} - ${targetExam.examName || targetExam.name}` : "No Target Exam Selected"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                className="bg-indigo-600 shadow-md hover:opacity-90 flex items-center justify-center gap-1.5 h-10 font-bold"
                disabled={!sourceBankId || !selectedExamId}
                onClick={importBank}
              >
                <Copy size={15} /> Copy & Import
              </Button>
              <Button
                className="bg-slate-800 shadow-md hover:opacity-90 flex items-center justify-center gap-1.5 h-10 font-bold"
                disabled={!sourceBankId || !selectedExamId}
                onClick={assignBank}
              >
                <ArrowRightLeft size={15} /> Assign to Exam
              </Button>
            </div>
          </div>
        </Card>

        {/* Add Question to Selected Bank */}
        <Card className="border border-border space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Plus className="text-emerald-600" size={18} />
              <h2 className="font-bold text-slate-900 text-sm">Add Question to Selected Bank</h2>
            </div>
            <Badge className="bg-primary/10 text-primary border-primary/20 font-mono text-[10px]">
              {selectedBank ? `${selectedBank.exam?.code || "Unassigned"} - ${selectedBank.name}` : "Local Draft"}
            </Badge>
          </div>

          <div className="space-y-3.5 text-xs">
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Select Question Bank *</label>
              <Select value={selectedBankId} onChange={(e) => setSelectedBankId(e.target.value)}>
                <option value="">Choose bank...</option>
                {banks.map((bank) => (
                  <option key={bank.id} value={bank.id}>
                    {bank.exam?.code || "Unassigned"} - {bank.name}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">Question Prompt *</label>
              <textarea
                className="w-full rounded-md border border-border bg-white dark:bg-slate-900 p-2.5 text-xs h-16 outline-none focus:ring-2 focus:ring-primary/25"
                placeholder="Enter question prompt..."
                value={draftPrompt}
                onChange={(e) => setDraftPrompt(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Subject</label>
                <Select value={draftSubject} onChange={(e) => setDraftSubject(e.target.value)}>
                  {subjectOptions.map((item) => <option key={item} value={item}>{item}</option>)}
                </Select>
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Topic</label>
                <Input placeholder="e.g. Algebra" value={draftTopic} onChange={(e) => setDraftTopic(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Type</label>
                <Select value={draftType} onChange={(e) => setDraftType(e.target.value)}>
                  {questionTypes.filter((item) => item !== "All Types").map((item) => <option key={item} value={item}>{item}</option>)}
                </Select>
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Difficulty</label>
                <Select value={draftDifficulty} onChange={(e) => setDraftDifficulty(e.target.value)}>
                  {difficulties.filter((item) => item !== "All Difficulties").map((item) => <option key={item} value={item}>{item}</option>)}
                </Select>
              </div>
            </div>

            <Button className="w-full bg-emerald-600 h-10 font-bold" onClick={addQuestion}>
              <CheckCircle size={15} /> Save Question to Database
            </Button>
          </div>
        </Card>
      </div>

      {/* Filter and Table view */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Questions in Selected Bank ({filteredRows.length})</h2>

        <Card className="flex flex-wrap items-center gap-3.5 py-3">
          <div className="flex-1 min-w-[200px]">
            <Input placeholder="Search question..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="w-[150px]">
            <Select value={examFilter} onChange={(e) => setExamFilter(e.target.value)}>
              <option>All Exams</option>
              {examCodes.map((item) => <option key={item} value={item}>{item}</option>)}
            </Select>
          </div>
          <div className="w-[150px]">
            <Select value={subject} onChange={(e) => setSubject(e.target.value)}>
              {subjects.map((item) => <option key={item} value={item}>{item}</option>)}
            </Select>
          </div>
          <div className="w-[140px]">
            <Select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
              {difficulties.map((item) => <option key={item} value={item}>{item}</option>)}
            </Select>
          </div>
          <div className="w-[140px]">
            <Select value={type} onChange={(e) => setType(e.target.value)}>
              {questionTypes.map((item) => <option key={item} value={item}>{item}</option>)}
            </Select>
          </div>
        </Card>

        <Table>
          <thead className="bg-muted/80 font-bold text-slate-700">
            <tr>
              <th className="p-3.5">Question Prompt & Answers</th>
              <th className="p-3.5">Assigned Exam</th>
              <th className="p-3.5">Subject & Topic</th>
              <th className="p-3.5">Type</th>
              <th className="p-3.5">Difficulty</th>
              <th className="p-3.5 text-center">Marks</th>
              <th className="p-3.5 text-center">Neg. Mark</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredRows.map((q) => (
              <tr className="hover:bg-slate-50/50 align-top" key={q.id ?? q.prompt}>
                <td className="p-3.5 font-medium max-w-[400px]">
                  <div className="text-slate-800 leading-snug">
                    {questionNumber(q.tags) ? `${questionNumber(q.tags)}. ` : ""}{q.prompt}
                  </div>
                  {!!q.options?.length && (
                    <div className="mt-2.5 flex flex-wrap gap-2 text-xs">
                      {q.options.map((option, idx) => (
                        <span
                          key={option.id}
                          className={`px-2 py-1 rounded border text-[10px] ${option.isCorrect ? "bg-emerald-50 border-emerald-300 text-emerald-800 font-bold" : "bg-slate-50 border-slate-200 text-slate-500"}`}
                        >
                          {String.fromCharCode(65 + idx)}. {option.text}
                        </span>
                      ))}
                    </div>
                  )}
                </td>
                <td className="p-3.5">
                  <Badge className="font-mono text-[9px] bg-slate-100 font-semibold">{q.bank?.exam?.code ?? "Draft"}</Badge>
                  <div className="mt-1 text-[10px] text-slate-400 font-medium">{q.bank?.name ?? "Local Draft"}</div>
                </td>
                <td className="p-3.5">
                  <div className="text-slate-700 font-medium">{q.subject.name}</div>
                  <div className="mt-0.5 text-[10px] text-slate-500">{q.topic.name}</div>
                </td>
                <td className="p-3.5 font-medium"><Badge>{q.questionType}</Badge></td>
                <td className="p-3.5 text-slate-600 font-medium">{q.difficulty}</td>
                <td className="p-3.5 text-center font-bold text-slate-800 font-mono">{q.marks}</td>
                <td className="p-3.5 text-center text-rose-600 font-bold font-mono">-{q.negativeMarks}</td>
              </tr>
            ))}
            {!filteredRows.length && (
              <tr>
                <td className="p-8 text-center text-slate-400" colSpan={7}>
                  No questions match your filter criteria.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>
    </section>
  );
}
