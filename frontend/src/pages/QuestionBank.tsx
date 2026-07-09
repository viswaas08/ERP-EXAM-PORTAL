import { Image, Plus, Shuffle } from "lucide-react";
import { useState } from "react";
import { Badge, Button, Card, Input, Select, Table } from "../components/ui";

const questions = ["Constitutional provisions are amended by which article?", "Find the next number in the sequence.", "Evaluate the numerical expression.", "Identify the correct network topology."];
const subjects = ["All Subjects", "General Studies", "Aptitude", "Mathematics", "Computer", "English", "Reasoning", "Current Affairs", "Domain Knowledge"];
const difficulties = ["All Difficulties", "Easy", "Medium", "Hard", "Expert"];
const questionTypes = ["All Types", "MCQ", "Multiple Select", "Numerical", "True False", "Image Question", "Comprehension", "Assertion Reason"];

export function QuestionBank() {
  const [rows, setRows] = useState(questions);
  const [notice, setNotice] = useState("Question bank ready.");
  const [paperCount, setPaperCount] = useState(0);

  function addQuestion() {
    const next = `New sample question ${rows.length + 1}?`;
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
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-bold">Question Bank</h1><p className="text-sm text-slate-500">Subjects, topics, difficulty levels, question types, explanations, and random paper generation.</p></div><div className="flex gap-2"><Button className="bg-secondary" onClick={generatePaper}><Shuffle size={18} /> Generate Paper</Button><Button onClick={addQuestion}><Plus size={18} /> Add Question</Button></div></div>
      <Card className="grid gap-3 md:grid-cols-4"><Input placeholder="Search question" /><Select>{subjects.map((item) => <option key={item}>{item}</option>)}</Select><Select>{difficulties.map((item) => <option key={item}>{item}</option>)}</Select><Select>{questionTypes.map((item) => <option key={item}>{item}</option>)}</Select></Card>
      <Table><thead className="bg-muted"><tr>{["Question", "Subject", "Topic", "Type", "Difficulty", "Marks", "Negative", "Tags"].map((h) => <th className="p-3" key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((q, i) => <tr className="border-t border-border" key={q}><td className="p-3 font-medium">{q} {i === 3 && <Image className="inline" size={15} />}</td><td className="p-3">{["General Studies", "Aptitude", "Mathematics", "Computer"][i % 4]}</td><td className="p-3">Topic {(i % 4) + 1}</td><td className="p-3"><Badge>{["MCQ", "Numerical", "True False", "Image"][i % 4]}</Badge></td><td className="p-3">{["Easy", "Medium", "Hard", "Medium"][i % 4]}</td><td className="p-3">2</td><td className="p-3">0.5</td><td className="p-3">Recruitment</td></tr>)}</tbody></Table>
    </section>
  );
}
