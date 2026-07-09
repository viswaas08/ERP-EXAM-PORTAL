import { Image, Plus, Shuffle } from "lucide-react";
import { Badge, Button, Card, Input, Select, Table } from "../components/ui";

const questions = ["Constitutional provisions are amended by which article?", "Find the next number in the sequence.", "Evaluate the numerical expression.", "Identify the correct network topology."];

export function QuestionBank() {
  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-bold">Question Bank</h1><p className="text-sm text-slate-500">Subjects, topics, difficulty levels, question types, explanations, and random paper generation.</p></div><div className="flex gap-2"><Button className="bg-secondary"><Shuffle size={18} /> Generate Paper</Button><Button><Plus size={18} /> Add Question</Button></div></div>
      <Card className="grid gap-3 md:grid-cols-4"><Input placeholder="Search question" /><Select><option>All Subjects</option></Select><Select><option>All Difficulties</option></Select><Select><option>All Types</option></Select></Card>
      <Table><thead className="bg-muted"><tr>{["Question", "Subject", "Topic", "Type", "Difficulty", "Marks", "Negative", "Tags"].map((h) => <th className="p-3" key={h}>{h}</th>)}</tr></thead><tbody>{questions.map((q, i) => <tr className="border-t border-border" key={q}><td className="p-3 font-medium">{q} {i === 3 && <Image className="inline" size={15} />}</td><td className="p-3">{["General Studies", "Aptitude", "Mathematics", "Computer"][i]}</td><td className="p-3">Topic {i + 1}</td><td className="p-3"><Badge>{["MCQ", "Numerical", "True False", "Image"][i]}</Badge></td><td className="p-3">{["Easy", "Medium", "Hard", "Medium"][i]}</td><td className="p-3">2</td><td className="p-3">0.5</td><td className="p-3">Recruitment</td></tr>)}</tbody></Table>
    </section>
  );
}
