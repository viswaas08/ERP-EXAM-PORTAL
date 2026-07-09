import { BookOpenCheck, FileText, Image, Layers, Plus, Shuffle } from "lucide-react";
import { useEffect, useMemo } from "react";
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
  exam: { id: string; code: string; name: string };
  _count?: { questions: number };
};

const initialQuestions: QuestionRow[] = [
  { prompt: "Constitutional provisions are amended by which article?", subject: { name: "General Studies" }, topic: { name: "Constitution" }, questionType: "MCQ", difficulty: "Easy", marks: 2, negativeMarks: 0.5, tags: ["recruitment", "Q1"] },
  { prompt: "Find the next number in the sequence.", subject: { name: "Aptitude" }, topic: { name: "Number Series" }, questionType: "Numerical", difficulty: "Medium", marks: 2, negativeMarks: 0.5, tags: ["recruitment", "Q2"] },
  { prompt: "Evaluate the numerical expression.", subject: { name: "Mathematics" }, topic: { name: "Algebra" }, questionType: "True False", difficulty: "Hard", marks: 2, negativeMarks: 0.5, tags: ["recruitment", "Q3"] },
  { prompt: "Identify the correct network topology.", subject: { name: "Computer" }, topic: { name: "Networking" }, questionType: "Image MCQ", difficulty: "Medium", marks: 2, negativeMarks: 0.5, tags: ["recruitment", "Q4"] }
];

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
  if (!Array.isArray(value)) return initialQuestions;
  return value.map((row, index) => normalizeQuestionRow((row ?? {}) as RawQuestionRow, index));
}

export function QuestionBank() {
  const [rows, setRows] = usePersistentState<QuestionRow[]>("examPortal.questions.rows", initialQuestions);
  const [notice, setNotice] = usePersistentState("examPortal.questions.notice", "Question bank ready.");
  const [paperCount, setPaperCount] = usePersistentState("examPortal.questions.paperCount", 0);
  const [search, setSearch] = usePersistentState("examPortal.questions.search", "");
  const [subject, setSubject] = usePersistentState("examPortal.questions.subject", "All Subjects");
  const [difficulty, setDifficulty] = usePersistentState("examPortal.questions.difficulty", "All Difficulties");
  const [type, setType] = usePersistentState("examPortal.questions.type", "All Types");
  const [examFilter, setExamFilter] = usePersistentState("examPortal.admin.selectedExamCode", "All Exams");
  const [selectedExamId] = usePersistentState<string | undefined>("examPortal.examinations.selectedExamId", undefined);
  const [draftPrompt, setDraftPrompt] = usePersistentState("examPortal.questions.draft.prompt", "");
  const [draftSubject, setDraftSubject] = usePersistentState("examPortal.questions.draft.subject", "General Studies");
  const [draftTopic, setDraftTopic] = usePersistentState("examPortal.questions.draft.topic", "General");
  const [draftDifficulty, setDraftDifficulty] = usePersistentState("examPortal.questions.draft.difficulty", "Medium");
  const [draftType, setDraftType] = usePersistentState("examPortal.questions.draft.type", "MCQ");
  const [banks, setBanks] = usePersistentState<QuestionBankSummary[]>("examPortal.questions.banks", []);
  const [selectedBankId, setSelectedBankId] = usePersistentState("examPortal.questions.selectedBankId", "");
  const [sourceBankId, setSourceBankId] = usePersistentState("examPortal.questions.sourceBankId", "");

  async function loadQuestions(bankId = selectedBankId) {
    try {
      const data = await api<QuestionRow[]>(bankId ? `/questions/bank?bankId=${encodeURIComponent(bankId)}` : "/questions/bank");
      if (data && data.length > 0) {
        setRows(normalizeQuestionRows(data));
        setNotice(`${data.length} database question(s) loaded${bankId ? " from the selected bank" : ""}.`);
      } else {
        setRows([]);
        setNotice("No questions found in the selected bank. Using the empty database view.");
      }
    } catch {
      setNotice("Could not load database questions. Using local mock questions.");
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
      setNotice("Could not load question banks. Showing local draft questions.");
    }
  }

  useEffect(() => {
    void loadBanks();
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
      const examMatch = examFilter === "All Exams" || q.bank?.exam.code === examFilter;
      return textMatch && subjectMatch && difficultyMatch && typeMatch && examMatch;
    });
  }, [safeRows, search, subject, difficulty, type, examFilter]);

  const subjects = useMemo(() => ["All Subjects", ...Array.from(new Set([...subjectOptions, ...safeRows.map((q) => q.subject.name)])).sort()], [safeRows]);
  const examCodes = useMemo(() => Array.from(new Set(safeRows.map((q) => q.bank?.exam.code).filter(Boolean))), [safeRows]);
  const totalMarks = safeRows.reduce((sum, q) => sum + Number(q.marks || 0), 0);
  const selectedBank = banks.find((bank) => bank.id === selectedBankId) ?? null;

  async function importBank() {
    if (!sourceBankId) {
      setNotice("Choose a source question bank to import.");
      return;
    }

    if (!selectedExamId) {
      setNotice("Select a target examination first from the Examinations page.");
      return;
    }

    try {
      const imported = await api<QuestionBankSummary>("/questions/banks/import", {
        method: "POST",
        body: JSON.stringify({ sourceBankId, targetExamId: selectedExamId })
      });
      setBanks((current) => [imported, ...current.filter((bank) => bank.id !== imported.id)]);
      setSelectedBankId(imported.id);
      setNotice(`Imported ${imported.name} into ${imported.exam.code}.`);
      await loadQuestions(imported.id);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not import the question bank.");
    }
  }

  function addQuestion() {
    const prompt = draftPrompt.trim() || `New sample question ${safeRows.length + 1}?`;
    const next: QuestionRow = {
      prompt,
      subject: { name: draftSubject },
      topic: { name: draftTopic.trim() || "General" },
      questionType: draftType,
      difficulty: draftDifficulty,
      marks: 2,
      negativeMarks: 0.5,
      tags: ["admin-draft", `Q${safeRows.length + 1}`],
      options: [
        { id: `draft-${Date.now()}-1`, text: "Option A", isCorrect: true },
        { id: `draft-${Date.now()}-2`, text: "Option B", isCorrect: false },
        { id: `draft-${Date.now()}-3`, text: "Option C", isCorrect: false },
        { id: `draft-${Date.now()}-4`, text: "Option D", isCorrect: false }
      ]
    };
    setRows((current) => [next, ...normalizeQuestionRows(current)]);
    setDraftPrompt("");
    setDraftTopic("General");
    setNotice("Question added to the admin question bank as a draft.");
  }

  function generatePaper() {
    setPaperCount((value) => value + 1);
    setNotice(`Random question paper #${paperCount + 1} generated from ${safeRows.length} question(s).`);
  }

  return (
    <section className="space-y-5">
      <Card className="border-l-4 border-l-primary py-3 text-sm font-medium">{notice}</Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold">Question Bank</h1><p className="text-sm text-slate-500">Subjects, topics, difficulty levels, question types, explanations, and random paper generation.</p></div>
        <div className="flex flex-wrap gap-2">
          <Button className="bg-slate-700" onClick={() => {
            setSearch("");
            setSubject("All Subjects");
            setDifficulty("All Difficulties");
            setType("All Types");
            setExamFilter("All Exams");
            setNotice("Filters reset.");
          }}>Reset Filters</Button>
          <Button className="bg-secondary" onClick={generatePaper}><Shuffle size={18} /> Generate Paper</Button>
          <Button onClick={addQuestion}><Plus size={18} /> Add Question</Button>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-4">
        <Card className="flex items-center justify-between"><div><p className="text-sm text-slate-500">Questions</p><p className="text-2xl font-bold">{safeRows.length}</p></div><BookOpenCheck className="text-primary" /></Card>
        <Card className="flex items-center justify-between"><div><p className="text-sm text-slate-500">Subjects</p><p className="text-2xl font-bold">{subjects.length - 1}</p></div><Layers className="text-emerald-700" /></Card>
        <Card className="flex items-center justify-between"><div><p className="text-sm text-slate-500">Marks</p><p className="text-2xl font-bold">{totalMarks}</p></div><FileText className="text-amber-700" /></Card>
        <Card className="flex items-center justify-between"><div><p className="text-sm text-slate-500">Papers</p><p className="text-2xl font-bold">{paperCount}</p></div><Shuffle className="text-indigo-700" /></Card>
      </div>
      <Card className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">Add Question</h2>
          <Badge>{selectedBank ? `${selectedBank.exam.code} · ${selectedBank.name}` : (examCodes.length ? examCodes.join(", ") : "Local Draft Bank")}</Badge>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <Select value={selectedBankId} onChange={(event) => setSelectedBankId(event.target.value)}>
            <option value="">Local Draft Questions</option>
            {banks.map((bank) => <option key={bank.id} value={bank.id}>{bank.exam.code} - {bank.name} ({bank._count?.questions ?? 0})</option>)}
          </Select>
          <Select value={sourceBankId} onChange={(event) => setSourceBankId(event.target.value)}>
            <option value="">Choose source bank</option>
            {banks.filter((bank) => bank.id !== selectedBankId).map((bank) => <option key={bank.id} value={bank.id}>{bank.exam.code} - {bank.name}</option>)}
          </Select>
          <Button className="bg-secondary" onClick={importBank}>Import bank into selected exam</Button>
        </div>
        <textarea className="min-h-24 w-full rounded-md border border-border bg-background p-3 text-sm" placeholder="Enter question prompt" value={draftPrompt} onChange={(event) => setDraftPrompt(event.target.value)} />
        <div className="grid gap-3 md:grid-cols-5">
          <Select value={draftSubject} onChange={(event) => setDraftSubject(event.target.value)}>
            {subjectOptions.map((item) => <option key={item} value={item}>{item}</option>)}
          </Select>
          <Input placeholder="Topic" value={draftTopic} onChange={(event) => setDraftTopic(event.target.value)} />
          <Select value={draftType} onChange={(event) => setDraftType(event.target.value)}>
            {questionTypes.filter((item) => item !== "All Types").map((item) => <option key={item} value={item}>{item}</option>)}
          </Select>
          <Select value={draftDifficulty} onChange={(event) => setDraftDifficulty(event.target.value)}>
            {difficulties.filter((item) => item !== "All Difficulties").map((item) => <option key={item} value={item}>{item}</option>)}
          </Select>
          <Button onClick={addQuestion}><Plus size={18} /> Save Draft</Button>
        </div>
      </Card>
      <Card className="grid gap-3 md:grid-cols-5">
        <Input placeholder="Search question" value={search} onChange={(event) => setSearch(event.target.value)} />
        <Select value={examFilter} onChange={(event) => setExamFilter(event.target.value)}>
          <option>All Exams</option>
          {examCodes.map((item) => <option key={item} value={item}>{item}</option>)}
        </Select>
        <Select value={subject} onChange={(event) => setSubject(event.target.value)}>
          {subjects.map((item) => <option key={item} value={item}>{item}</option>)}
        </Select>
        <Select value={difficulty} onChange={(event) => setDifficulty(event.target.value)}>
          {difficulties.map((item) => <option key={item} value={item}>{item}</option>)}
        </Select>
        <Select value={type} onChange={(event) => setType(event.target.value)}>
          {questionTypes.map((item) => <option key={item} value={item}>{item}</option>)}
        </Select>
      </Card>
      <Table>
        <thead className="bg-muted">
          <tr>{["Question", "Exam Bank", "Subject", "Topic", "Type", "Difficulty", "Marks", "Negative", "Tags"].map((h) => <th className="p-3" key={h}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {filteredRows.map((q) => (
            <tr className="border-t border-border align-top" key={q.id ?? q.prompt}>
              <td className="p-3 font-medium">
                {questionNumber(q.tags) ? `${questionNumber(q.tags)}. ` : ""}{q.prompt} {q.questionType === "Image MCQ" && <Image className="inline ml-1" size={15} />}
                {!!q.options?.length && <div className="mt-2 text-xs font-normal text-slate-500">{q.options.map((option) => `${option.isCorrect ? "*" : ""}${option.text}`).join(" | ")}</div>}
              </td>
              <td className="p-3"><Badge>{q.bank?.exam.code ?? "Draft"}</Badge><div className="mt-1 text-xs text-slate-500">{q.bank?.name ?? "Local question bank"}</div></td>
              <td className="p-3">{q.subject.name}</td>
              <td className="p-3">{q.topic.name}</td>
              <td className="p-3"><Badge>{q.questionType}</Badge></td>
              <td className="p-3">{q.difficulty}</td>
              <td className="p-3">{q.marks}</td>
              <td className="p-3">{q.negativeMarks}</td>
              <td className="p-3">{q.tags.filter(t => !t.startsWith("Q")).join(", ")}</td>
            </tr>
          ))}
          {!filteredRows.length && (
            <tr><td className="p-6 text-center text-slate-500" colSpan={9}>No questions match your filters.</td></tr>
          )}
        </tbody>
      </Table>
    </section>
  );
}
