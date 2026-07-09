import { Image, Plus, Shuffle } from "lucide-react";
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

const initialQuestions: QuestionRow[] = [
  { prompt: "Constitutional provisions are amended by which article?", subject: { name: "General Studies" }, topic: { name: "Constitution" }, questionType: "MCQ", difficulty: "Easy", marks: 2, negativeMarks: 0.5, tags: ["recruitment", "Q1"] },
  { prompt: "Find the next number in the sequence.", subject: { name: "Aptitude" }, topic: { name: "Number Series" }, questionType: "Numerical", difficulty: "Medium", marks: 2, negativeMarks: 0.5, tags: ["recruitment", "Q2"] },
  { prompt: "Evaluate the numerical expression.", subject: { name: "Mathematics" }, topic: { name: "Algebra" }, questionType: "True False", difficulty: "Hard", marks: 2, negativeMarks: 0.5, tags: ["recruitment", "Q3"] },
  { prompt: "Identify the correct network topology.", subject: { name: "Computer" }, topic: { name: "Networking" }, questionType: "Image MCQ", difficulty: "Medium", marks: 2, negativeMarks: 0.5, tags: ["recruitment", "Q4"] }
];

const subjects = ["All Subjects", "General Studies", "Aptitude", "Mathematics", "Computer", "English", "Reasoning", "Current Affairs", "Domain Knowledge"];
const difficulties = ["All Difficulties", "Easy", "Medium", "Hard", "Expert"];
const questionTypes = ["All Types", "MCQ", "Multiple Select", "Numerical", "True False", "Image MCQ", "Comprehension", "Assertion Reason"];

function questionNumber(tags: string[]) {
  const tag = tags.find((item) => /^Q\d+$/.test(item));
  return tag ? Number(tag.slice(1)) : 0;
}

export function QuestionBank() {
  const [rows, setRows] = usePersistentState<QuestionRow[]>("examPortal.questions.rows", initialQuestions);
  const [notice, setNotice] = usePersistentState("examPortal.questions.notice", "Question bank ready.");
  const [paperCount, setPaperCount] = usePersistentState("examPortal.questions.paperCount", 0);
  const [search, setSearch] = usePersistentState("examPortal.questions.search", "");
  const [subject, setSubject] = usePersistentState("examPortal.questions.subject", "All Subjects");
  const [difficulty, setDifficulty] = usePersistentState("examPortal.questions.difficulty", "All Difficulties");
  const [type, setType] = usePersistentState("examPortal.questions.type", "All Types");

  async function loadQuestions() {
    try {
      const data = await api<QuestionRow[]>("/questions/bank");
      if (data && data.length > 0) {
        setRows(data);
        setNotice(`${data.length} database question(s) loaded.`);
      } else {
        setNotice("No questions found in the database. Using local mock questions.");
      }
    } catch {
      setNotice("Could not load database questions. Using local mock questions.");
    }
  }

  useEffect(() => {
    void loadQuestions();
  }, []);

  const filteredRows = useMemo(() => {
    return rows.filter((q) => {
      const textMatch = q.prompt.toLowerCase().includes(search.toLowerCase());
      const subjectMatch = subject === "All Subjects" || q.subject.name === subject;
      const difficultyMatch = difficulty === "All Difficulties" || q.difficulty === difficulty;
      const typeMatch = type === "All Types" || q.questionType === type;
      return textMatch && subjectMatch && difficultyMatch && typeMatch;
    });
  }, [rows, search, subject, difficulty, type]);

  function addQuestion() {
    const next: QuestionRow = {
      prompt: `New sample question ${rows.length + 1}?`,
      subject: { name: "General Studies" },
      topic: { name: "General" },
      questionType: "MCQ",
      difficulty: "Medium",
      marks: 2,
      negativeMarks: 0.5,
      tags: ["recruitment", `Q${rows.length + 1}`]
    };
    setRows((current) => [next, ...current]);
    setNotice("New MCQ question added as draft.");
  }

  function generatePaper() {
    setPaperCount((value) => value + 1);
    setNotice(`Random question paper #${paperCount + 1} generated from ${rows.length} question(s).`);
  }

  return (
    <section className="space-y-5">
      <Card className="border-l-4 border-l-primary py-3 text-sm font-medium">{notice}</Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold">Question Bank</h1><p className="text-sm text-slate-500">Subjects, topics, difficulty levels, question types, explanations, and random paper generation.</p></div>
        <div className="flex gap-2">
          <Button className="bg-slate-700" onClick={() => {
            setSearch("");
            setSubject("All Subjects");
            setDifficulty("All Difficulties");
            setType("All Types");
            setNotice("Filters reset.");
          }}>Reset Filters</Button>
          <Button className="bg-secondary" onClick={generatePaper}><Shuffle size={18} /> Generate Paper</Button>
          <Button onClick={addQuestion}><Plus size={18} /> Add Question</Button>
        </div>
      </div>
      <Card className="grid gap-3 md:grid-cols-4">
        <Input placeholder="Search question" value={search} onChange={(event) => setSearch(event.target.value)} />
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
          <tr>{["Question", "Subject", "Topic", "Type", "Difficulty", "Marks", "Negative", "Tags"].map((h) => <th className="p-3" key={h}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {filteredRows.map((q) => (
            <tr className="border-t border-border" key={q.prompt}>
              <td className="p-3 font-medium">
                {questionNumber(q.tags) ? `${questionNumber(q.tags)}. ` : ""}{q.prompt} {q.questionType === "Image MCQ" && <Image className="inline ml-1" size={15} />}
              </td>
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
            <tr><td className="p-6 text-center text-slate-500" colSpan={8}>No questions match your filters.</td></tr>
          )}
        </tbody>
      </Table>
    </section>
  );
}
