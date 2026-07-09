import { RefreshCw, Shuffle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, Input, Select, Table } from "../components/ui";
import { usePersistentState } from "../lib/usePersistentState";
import { api } from "../lib/api";

type QuestionRow = {
  id: string;
  prompt: string;
  questionType: string;
  difficulty: string;
  marks: number;
  negativeMarks: number;
  tags: string[];
  subject: { name: string };
  topic: { name: string };
  bank: { name: string; exam: { code: string; name: string } };
  options: Array<{ id: string; text: string; isCorrect: boolean }>;
};

const subjects = ["All Subjects", "English", "Maths", "Chemistry", "Physics"];
const difficulties = ["All Difficulties", "Easy", "Medium", "Hard"];
const questionTypes = ["All Types", "MCQ"];

function questionNumber(tags: string[]) {
  const tag = tags.find((item) => /^Q\d+$/.test(item));
  return tag ? Number(tag.slice(1)) : 0;
}

export function QuestionBank() {
  const [rows, setRows] = useState<QuestionRow[]>([]);
  const [notice, setNotice] = usePersistentState("examPortal.questions.v2.notice", "Question bank loads from the database.");
  const [paperCount, setPaperCount] = usePersistentState("examPortal.questions.v2.paperCount", 0);
  const [search, setSearch] = usePersistentState("examPortal.questions.v2.search", "");
  const [subject, setSubject] = usePersistentState("examPortal.questions.v2.subject", "All Subjects");
  const [difficulty, setDifficulty] = usePersistentState("examPortal.questions.v2.difficulty", "All Difficulties");
  const [questionType, setQuestionType] = usePersistentState("examPortal.questions.v2.type", "All Types");

  async function loadQuestions() {
    try {
      const data = await api<QuestionRow[]>("/questions/bank");
      setRows(data);
      setNotice(`${data.length} database question(s) loaded.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not load database questions.");
    }
  }

  useEffect(() => {
    void loadQuestions();
  }, []);

  const filteredRows = useMemo(() => rows.filter((row) => {
    const text = `${row.prompt} ${row.subject.name} ${row.topic.name} ${row.bank.exam.code}`.toLowerCase();
    const textMatch = text.includes(search.toLowerCase());
    const subjectMatch = subject === "All Subjects" || row.subject.name === subject;
    const difficultyMatch = difficulty === "All Difficulties" || row.difficulty === difficulty;
    const typeMatch = questionType === "All Types" || row.questionType === questionType;
    return textMatch && subjectMatch && difficultyMatch && typeMatch;
  }), [difficulty, questionType, rows, search, subject]);

  function generatePaper() {
    setPaperCount((value) => value + 1);
    setNotice(`Paper preview #${paperCount + 1}: ${filteredRows.length} filtered question(s), ${rows.length} total in database.`);
  }

  return (
    <section className="space-y-5">
      <Card className="border-l-4 border-l-primary py-3 text-sm font-medium">{notice}</Card>
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-bold">Question Bank</h1><p className="text-sm text-slate-500">Database question paper, sections, topics, difficulty levels, and answer keys.</p></div><div className="flex gap-2"><Button className="bg-secondary" onClick={generatePaper}><Shuffle size={18} /> Preview Paper</Button><Button onClick={loadQuestions}><RefreshCw size={18} /> Refresh</Button></div></div>
      <Card className="grid gap-3 md:grid-cols-4"><Input placeholder="Search question" value={search} onChange={(event) => setSearch(event.target.value)} /><Select value={subject} onChange={(event) => setSubject(event.target.value)}>{subjects.map((item) => <option key={item}>{item}</option>)}</Select><Select value={difficulty} onChange={(event) => setDifficulty(event.target.value)}>{difficulties.map((item) => <option key={item}>{item}</option>)}</Select><Select value={questionType} onChange={(event) => setQuestionType(event.target.value)}>{questionTypes.map((item) => <option key={item}>{item}</option>)}</Select></Card>
      <Table><thead className="bg-muted"><tr>{["No", "Question", "Subject", "Topic", "Type", "Difficulty", "Marks", "Answer"].map((h) => <th className="p-3" key={h}>{h}</th>)}</tr></thead><tbody>{filteredRows.map((row) => <tr className="border-t border-border" key={row.id}><td className="p-3 font-semibold">{questionNumber(row.tags) || "-"}</td><td className="p-3 font-medium">{row.prompt}</td><td className="p-3">{row.subject.name}</td><td className="p-3">{row.topic.name}</td><td className="p-3"><Badge>{row.questionType}</Badge></td><td className="p-3">{row.difficulty}</td><td className="p-3">{row.marks}</td><td className="p-3">{row.options.find((option) => option.isCorrect)?.text ?? "Not set"}</td></tr>)}{!filteredRows.length && <tr><td className="p-6 text-center text-slate-500" colSpan={8}>No database questions found.</td></tr>}</tbody></Table>
    </section>
  );
}
