import { Copy, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, Input, Select, Table } from "../components/ui";
import { exams, phases } from "../data/demo";
import { api } from "../lib/api";

type WorkflowPhase = {
  id: string;
  name: string;
  status: string;
  opensAt: string;
  closesAt: string;
};

type ExamRow = {
  id?: string;
  code: string;
  name: string;
  department: string;
  phase: string;
  dates: string;
  applications: number;
  status: string;
  workflowPhases?: WorkflowPhase[];
};

type ApiExam = {
  id: string;
  code: string;
  name: string;
  department: string;
  status: string;
  workflowPhases: WorkflowPhase[];
  _count?: { applications: number };
};
const departments = ["", "Administrative Services", "Higher Education", "Public Works", "Health Services", "Police Recruitment", "Technical Education", "University Authority"];
const statusOptions = ["", "Active", "Open", "Draft", "Archived", "Updated", "Closed"];

export function Examinations() {
  const [rows, setRows] = useState<ExamRow[]>(exams);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [status, setStatus] = useState("");
  const [notice, setNotice] = useState("Ready to manage examinations.");
  const [selectedCode, setSelectedCode] = useState(rows[0]?.code ?? "");
  const [selectedExamId, setSelectedExamId] = useState<string | undefined>();

  useEffect(() => {
    api<ApiExam[]>("/examinations")
      .then((data) => {
        const mapped = data.map((exam) => {
          const activePhase = exam.workflowPhases.find((phase) => phase.status === "OPEN") ?? exam.workflowPhases[0];
          return {
            id: exam.id,
            code: exam.code,
            name: exam.name,
            department: exam.department,
            phase: activePhase?.name ?? "Registration",
            dates: activePhase ? `${new Date(activePhase.opensAt).toLocaleDateString()} - ${new Date(activePhase.closesAt).toLocaleDateString()}` : "Not scheduled",
            applications: exam._count?.applications ?? 0,
            status: exam.status,
            workflowPhases: exam.workflowPhases
          };
        });
        if (mapped.length) {
          setRows(mapped);
          setSelectedCode(mapped[0].code);
          setSelectedExamId(mapped[0].id);
          setNotice("Loaded live examinations and workflow phases from the database.");
        }
      })
      .catch(() => setNotice("Using demo examinations because the API is not reachable."));
  }, []);

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

  async function activatePhase(phase: WorkflowPhase) {
    if (!selectedExamId) {
      setNotice("Select a database-backed examination before activating a phase.");
      return;
    }

    await api<WorkflowPhase>(`/examinations/${selectedExamId}/workflow-phases/${phase.id}/activate`, { method: "PATCH" });
    setRows((current) => current.map((exam) => exam.id === selectedExamId ? {
      ...exam,
      phase: phase.name,
      workflowPhases: exam.workflowPhases?.map((item) => ({ ...item, status: item.id === phase.id ? "OPEN" : "SCHEDULED" }))
    } : exam));
    setNotice(`${phase.name} activated and saved to the database. Candidate pages now use this phase.`);
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
        <Select value={department} onChange={(event) => setDepartment(event.target.value)}>{departments.map((item) => <option key={item} value={item}>{item || "All Departments"}</option>)}</Select>
        <Select value={status} onChange={(event) => setStatus(event.target.value)}>{statusOptions.map((item) => <option key={item} value={item}>{item || "All Statuses"}</option>)}</Select>
        <Button className="bg-secondary" onClick={() => setNotice(`${filteredRows.length} examination(s) match your filters.`)}>Apply Filters</Button>
      </Card>
      <Table>
        <thead className="bg-muted"><tr>{["Code", "Exam", "Department", "Current Phase", "Dates", "Applications", "Status", "Actions"].map((h) => <th className="p-3" key={h}>{h}</th>)}</tr></thead>
        <tbody>
          {filteredRows.map((exam) => (
            <tr className={`border-t border-border ${selectedCode === exam.code ? "bg-muted/60" : ""}`} key={exam.code} onClick={() => { setSelectedCode(exam.code); setSelectedExamId(exam.id); }}>
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
          {!filteredRows.length && <tr><td className="p-6 text-center text-slate-500" colSpan={8}>No examinations match the selected filters.</td></tr>}
        </tbody>
      </Table>
      <Card>
        <h2 className="mb-4 font-semibold">Workflow Phase Engine</h2>
        <div className="grid gap-3 md:grid-cols-6">
          {(rows.find((exam) => exam.code === selectedCode)?.workflowPhases ?? phases.map((name, index) => ({ id: name, name, status: index === 0 ? "OPEN" : "SCHEDULED", opensAt: "", closesAt: "" }))).map((phase, index) => <button className="rounded-md border border-border p-3 text-left hover:bg-muted" key={phase.id} onClick={() => activatePhase(phase)}><p className="text-xs text-slate-500">Step {index + 1}</p><p className="font-semibold">{phase.name}</p><Badge className={`mt-3 ${phase.status === "OPEN" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950" : ""}`}>{phase.status}</Badge></button>)}
        </div>
      </Card>
    </section>
  );
}
