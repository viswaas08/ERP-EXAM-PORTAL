import { Copy, Pencil, Plus, Trash2 } from "lucide-react";
import { Badge, Button, Card, Input, Table } from "../components/ui";
import { exams, phases } from "../data/demo";

export function Examinations() {
  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold">Examination Management</h1><p className="text-sm text-slate-500">Create, edit, clone, archive, and phase-control examinations.</p></div>
        <Button><Plus size={18} /> New Exam</Button>
      </div>
      <Card className="grid gap-3 md:grid-cols-4">
        <Input placeholder="Exam name or code" />
        <Input placeholder="Department" />
        <Input placeholder="Status" />
        <Button className="bg-secondary">Apply Filters</Button>
      </Card>
      <Table>
        <thead className="bg-muted"><tr>{["Code", "Exam", "Department", "Current Phase", "Dates", "Applications", "Status", "Actions"].map((h) => <th className="p-3" key={h}>{h}</th>)}</tr></thead>
        <tbody>
          {exams.map((exam) => (
            <tr className="border-t border-border" key={exam.code}>
              <td className="p-3 font-semibold">{exam.code}</td>
              <td className="p-3">{exam.name}</td>
              <td className="p-3">{exam.department}</td>
              <td className="p-3"><Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950">{exam.phase}</Badge></td>
              <td className="p-3">{exam.dates}</td>
              <td className="p-3">{exam.applications}</td>
              <td className="p-3"><Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950">{exam.status}</Badge></td>
              <td className="p-3"><div className="flex gap-2"><Button className="h-8 w-8 px-0"><Pencil size={15} /></Button><Button className="h-8 w-8 bg-secondary px-0"><Copy size={15} /></Button><Button className="h-8 w-8 bg-destructive px-0"><Trash2 size={15} /></Button></div></td>
            </tr>
          ))}
        </tbody>
      </Table>
      <Card>
        <h2 className="mb-4 font-semibold">Workflow Phase Engine</h2>
        <div className="grid gap-3 md:grid-cols-6">
          {phases.map((phase, index) => <div className="rounded-md border border-border p-3" key={phase}><p className="text-xs text-slate-500">Step {index + 1}</p><p className="font-semibold">{phase}</p><Badge className="mt-3">{index < 3 ? "Open" : "Scheduled"}</Badge></div>)}
        </div>
      </Card>
    </section>
  );
}
