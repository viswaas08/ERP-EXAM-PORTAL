import { Download, Eye, Filter, RotateCcw } from "lucide-react";
import { applications } from "../data/demo";
import { Badge, Button, Card, Input, Select, Table } from "../components/ui";

export function Applications() {
  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-bold">Application Management</h1><p className="text-sm text-slate-500">Search, filter, bulk process, export, and review candidate records.</p></div><Button><Download size={18} /> Export</Button></div>
      <Card className="grid gap-3 md:grid-cols-5"><Input placeholder="Search candidate" /><Select><option>All Exams</option></Select><Select><option>All Statuses</option></Select><Select><option>All Categories</option></Select><Button className="bg-secondary"><Filter size={18} /> Filter</Button></Card>
      <Table>
        <thead className="bg-muted"><tr>{["Application", "Candidate", "Exam", "Category", "State", "Score", "Status", "Action"].map((h) => <th className="p-3" key={h}>{h}</th>)}</tr></thead>
        <tbody>{applications.map((app) => <tr className="border-t border-border" key={app.id}><td className="p-3 font-semibold">{app.id}</td><td className="p-3">{app.name}</td><td className="p-3">{app.exam}</td><td className="p-3">{app.category}</td><td className="p-3">{app.state}</td><td className="p-3">{app.score}%</td><td className="p-3"><Badge>{app.status}</Badge></td><td className="p-3"><div className="flex gap-2"><Button className="h-8 w-8 px-0"><Eye size={15} /></Button><Button className="h-8 w-8 bg-secondary px-0"><RotateCcw size={15} /></Button></div></td></tr>)}</tbody>
      </Table>
    </section>
  );
}
