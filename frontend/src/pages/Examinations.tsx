import { Copy, Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge, Button, Card, Input, Table } from "../components/ui";
import { exams, phases } from "../data/demo";

export function Examinations() {
  const [rows, setRows] = useState(exams);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [status, setStatus] = useState("");
  const [notice, setNotice] = useState("Ready to manage examinations.");
  const [selectedCode, setSelectedCode] = useState(rows[0]?.code ?? "");

  const filteredRows = useMemo(() => rows.filter((exam) => {
    const textMatch = `${exam.code} ${exam.name}`.toLowerCase().includes(search.toLowerCase());
    const departmentMatch = exam.department.toLowerCase().includes(department.toLowerCase());
    const statusMatch = exam.status.toLowerCase().includes(status.toLowerCase());
    return textMatch && departmentMatch && statusMatch;
  }), [rows, search, department, status]);

  function createExam() {
    const next = {
      code: `NEW-${String(rows.length + 1).padStart(3, "0")}`,
      name: "New Configurable Examination",
      department: "New Department",
      phase: "Registration",
      dates: "Draft schedule",
      applications: 0,
      status: "Draft"
    };
    setRows((current) => [next, ...current]);
    setSelectedCode(next.code);
    setNotice(`${next.code} created as a draft examination.`);
  }

  function editExam(code: string) {
    setRows((current) => current.map((exam) => exam.code === code ? { ...exam, phase: "Correction Window", status: "Updated" } : exam));
    setSelectedCode(code);
    setNotice(`${code} moved to Correction Window and marked Updated.`);
  }

  function cloneExam(code: string) {
    const source = rows.find((exam) => exam.code === code);
    if (!source) return;
    const clone = { ...source, code: `${source.code}-CLONE`, name: `${source.name} Copy`, status: "Draft", applications: 0 };
    setRows((current) => [clone, ...current]);
    setSelectedCode(clone.code);
    setNotice(`${source.code} cloned into ${clone.code}.`);
  }

  function deleteExam(code: string) {
    setRows((current) => current.filter((exam) => exam.code !== code));
    setNotice(`${code} archived from the active list.`);
  }

  return (
    <section className="space-y-5">
      <Card className="border-l-4 border-l-primary py-3 text-sm font-medium">{notice}</Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold">Examination Management</h1><p className="text-sm text-slate-500">Create, edit, clone, archive, and phase-control examinations.</p></div>
        <Button onClick={createExam}><Plus size={18} /> New Exam</Button>
      </div>
      <Card className="grid gap-3 md:grid-cols-4">
        <Input placeholder="Exam name or code" value={search} onChange={(event) => setSearch(event.target.value)} />
        <Input placeholder="Department" value={department} onChange={(event) => setDepartment(event.target.value)} />
        <Input placeholder="Status" value={status} onChange={(event) => setStatus(event.target.value)} />
        <Button className="bg-secondary" onClick={() => setNotice(`${filteredRows.length} examination(s) match your filters.`)}>Apply Filters</Button>
      </Card>
      <Table>
        <thead className="bg-muted"><tr>{["Code", "Exam", "Department", "Current Phase", "Dates", "Applications", "Status", "Actions"].map((h) => <th className="p-3" key={h}>{h}</th>)}</tr></thead>
        <tbody>
          {filteredRows.map((exam) => (
            <tr className={`border-t border-border ${selectedCode === exam.code ? "bg-muted/60" : ""}`} key={exam.code}>
              <td className="p-3 font-semibold">{exam.code}</td>
              <td className="p-3">{exam.name}</td>
              <td className="p-3">{exam.department}</td>
              <td className="p-3"><Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950">{exam.phase}</Badge></td>
              <td className="p-3">{exam.dates}</td>
              <td className="p-3">{exam.applications}</td>
              <td className="p-3"><Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950">{exam.status}</Badge></td>
              <td className="p-3"><div className="flex gap-2"><Button className="h-8 w-8 px-0" onClick={() => editExam(exam.code)} title="Edit"><Pencil size={15} /></Button><Button className="h-8 w-8 bg-secondary px-0" onClick={() => cloneExam(exam.code)} title="Clone"><Copy size={15} /></Button><Button className="h-8 w-8 bg-destructive px-0" onClick={() => deleteExam(exam.code)} title="Archive"><Trash2 size={15} /></Button></div></td>
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
