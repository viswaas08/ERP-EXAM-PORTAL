import { Copy, Pencil, PlayCircle, Plus, Radio, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, Input, Select, Table } from "../components/ui";
import { phases } from "../data/demo";
import { api } from "../lib/api";
import { usePersistentState } from "../lib/usePersistentState";

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
const statusOptions = ["", "Live", "Active", "Open", "Draft", "Archived", "Updated", "Closed"];

function isLiveStatus(status: string) {
  return ["OPEN", "ACTIVE", "LIVE"].includes(status.toUpperCase());
}

function statusLabel(status: string) {
  return isLiveStatus(status) ? "LIVE" : status;
}

function mapApiExam(exam: ApiExam): ExamRow {
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
}

export function Examinations() {
  const [rows, setRows] = usePersistentState<ExamRow[]>("examPortal.examinations.v2.rows", []);
  const [search, setSearch] = usePersistentState("examPortal.examinations.search", "");
  const [department, setDepartment] = usePersistentState("examPortal.examinations.department", "");
  const [status, setStatus] = usePersistentState("examPortal.examinations.status", "");
  const [notice, setNotice] = usePersistentState("examPortal.examinations.notice", "Ready to manage examinations.");
  const [selectedCode, setSelectedCode] = usePersistentState("examPortal.examinations.selectedCode", rows[0]?.code ?? "");
  const [selectedExamId, setSelectedExamId] = usePersistentState<string | undefined>("examPortal.examinations.selectedExamId", undefined);
  const [, setAdminSelectedExamCode] = usePersistentState("examPortal.admin.selectedExamCode", "All Exams");
  const [hasLocalChanges, setHasLocalChanges] = usePersistentState("examPortal.examinations.hasLocalChanges", false);

  useEffect(() => {
    api<ApiExam[]>("/examinations")
      .then((data) => {
        const mapped = data.map(mapApiExam);
        setRows(mapped);
        setSelectedCode(mapped[0]?.code ?? "");
        setSelectedExamId(mapped[0]?.id);
        setAdminSelectedExamCode(mapped[0]?.code ?? "All Exams");
        setHasLocalChanges(false);
        setNotice(mapped.length ? "Loaded examinations from the database." : "No examinations exist yet. Create the first examination from Admin.");
      })
      .catch(() => {
        if (hasLocalChanges && rows.length) {
          setNotice("Could not reach the examination API. Showing saved local examination changes.");
          return;
        }
        setRows([]);
        setSelectedCode("");
        setSelectedExamId(undefined);
        setNotice("Could not reach the examination API. No examinations are shown.");
      });
  }, []);

  const filteredRows = useMemo(() => rows.filter((exam) => {
    const textMatch = `${exam.code} ${exam.name}`.toLowerCase().includes(search.toLowerCase());
    const departmentMatch = exam.department.toLowerCase().includes(department.toLowerCase());
    const normalizedStatus = status.toLowerCase();
    const statusMatch = !normalizedStatus || exam.status.toLowerCase().includes(normalizedStatus) || (normalizedStatus === "live" && isLiveStatus(exam.status));
    return textMatch && departmentMatch && statusMatch;
  }), [rows, search, department, status]);
  const liveRows = useMemo(() => rows.filter((exam) => isLiveStatus(exam.status)), [rows]);

  async function createExam() {
    const next = {
      code: `NEW-${String(rows.length + 1).padStart(3, "0")}`,
      name: "New Configurable Examination",
      department: "New Department",
      phase: "Registration",
      dates: "Draft schedule",
      applications: 0,
      status: "Draft"
    };

    try {
      const created = await api<ApiExam>("/examinations", {
        method: "POST",
        body: JSON.stringify({
          name: next.name,
          code: next.code,
          department: next.department,
          durationMinutes: 120,
          maximumMarks: 200,
          passingMarks: 80,
          negativeMarking: false,
          languages: ["English", "Hindi"]
        })
      });
      const mapped = mapApiExam(created);
      setRows((current) => [mapped, ...current]);
      setSelectedCode(mapped.code);
      setSelectedExamId(mapped.id);
      setAdminSelectedExamCode(mapped.code);
      setHasLocalChanges(true);
      setNotice(`${mapped.code} created in Neon database.`);
      return;
    } catch {
      setNotice("API create failed, saved the draft in ERP database state instead.");
    }

    setRows((current) => [next, ...current]);
    setHasLocalChanges(true);
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
    setHasLocalChanges(true);
    setNotice(`${phase.name} activated and saved to the database. Candidate pages now use this phase.`);
  }

  async function editExam(code: string) {
    const source = rows.find((exam) => exam.code === code);
    if (source?.id) {
      try {
        const updated = await api<ApiExam>(`/examinations/${source.id}`, {
          method: "PATCH",
          body: JSON.stringify({ status: "UPDATED" })
        });
        const mapped = mapApiExam(updated);
        setRows((current) => current.map((exam) => exam.id === mapped.id ? mapped : exam));
        setSelectedCode(mapped.code);
        setAdminSelectedExamCode(mapped.code);
        setHasLocalChanges(true);
        setNotice(`${mapped.code} updated in Neon database.`);
        return;
      } catch {
        setNotice("API update failed, saved the edit in ERP database state instead.");
      }
    }
    setRows((current) => current.map((exam) => exam.code === code ? { ...exam, phase: "Correction Window", status: "Updated" } : exam));
    setHasLocalChanges(true);
    setSelectedCode(code);
    setNotice(`${code} moved to Correction Window and marked Updated.`);
  }

  async function makeLive(code: string) {
    const source = rows.find((exam) => exam.code === code);
    if (!source?.id) {
      setRows((current) => current.map((exam) => exam.code === code ? { ...exam, status: "OPEN" } : exam));
      setSelectedCode(code);
      setAdminSelectedExamCode(code);
      setNotice(`${code} marked live locally.`);
      return;
    }

    try {
      const updated = await api<ApiExam>(`/examinations/${source.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "OPEN" })
      });
      const mapped = mapApiExam(updated);
      setRows((current) => current.map((exam) => exam.id === mapped.id ? mapped : exam));
      setSelectedCode(mapped.code);
      setSelectedExamId(mapped.id);
      setAdminSelectedExamCode(mapped.code);
      setStatus("Live");
      setNotice(`${mapped.code} is now live and visible to candidates.`);
    } catch {
      setNotice("Could not mark the examination live.");
    }
  }

  async function cloneExam(code: string) {
    const source = rows.find((exam) => exam.code === code);
    if (!source) return;
    if (source.id) {
      try {
        const created = await api<ApiExam>(`/examinations/${source.id}/clone`, { method: "POST" });
        const mapped = mapApiExam(created);
        setRows((current) => [mapped, ...current]);
        setSelectedCode(mapped.code);
        setSelectedExamId(mapped.id);
        setAdminSelectedExamCode(mapped.code);
        setHasLocalChanges(true);
        setNotice(`${source.code} cloned in Neon as ${mapped.code}.`);
        return;
      } catch {
        setNotice("API clone failed, saved the clone in ERP database state instead.");
      }
    }
    const clone = { ...source, code: `${source.code}-CLONE`, name: `${source.name} Copy`, status: "Draft", applications: 0 };
    setRows((current) => [clone, ...current]);
    setHasLocalChanges(true);
    setSelectedCode(clone.code);
    setAdminSelectedExamCode(clone.code);
    setNotice(`${source.code} cloned into ${clone.code}.`);
  }

  async function deleteExam(code: string) {
    const source = rows.find((exam) => exam.code === code);
    if (source?.id) {
      try {
        const archived = await api<ApiExam>(`/examinations/${source.id}`, { method: "DELETE" });
        const mapped = mapApiExam(archived);
        setRows((current) => current.map((exam) => exam.id === mapped.id ? mapped : exam));
        setHasLocalChanges(true);
        setNotice(`${mapped.code} archived in Neon database.`);
        return;
      } catch {
        setNotice("API archive failed, archived the row in ERP database state instead.");
      }
    }
    setRows((current) => current.filter((exam) => exam.code !== code));
    setHasLocalChanges(true);
    setNotice(`${code} archived from the active list.`);
  }

  function resetLocalChanges() {
    localStorage.removeItem("examPortal.examinations.rows");
    localStorage.removeItem("examPortal.examinations.v2.rows");
    localStorage.removeItem("examPortal.examinations.hasLocalChanges");
    setRows([]);
    setHasLocalChanges(false);
    setNotice("Local examination changes cleared. Live database data will load again.");
  }

  function showLiveExams() {
    setSearch("");
    setDepartment("");
    setStatus("Live");
    setNotice(`${liveRows.length} live examination(s) are visible.`);
  }

  return (
    <section className="space-y-5">
      <Card className="border-l-4 border-l-primary py-3 text-sm font-medium">{notice}</Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold">Examination Management</h1><p className="text-sm text-slate-500">Create, edit, clone, archive, and phase-control examinations.</p></div>
        <div className="flex flex-wrap gap-2">
          <Button className="bg-emerald-600" onClick={showLiveExams}><Radio size={18} /> Live Exams</Button>
          <Button onClick={createExam}><Plus size={18} /> New Exam</Button>
          <Button className="bg-slate-700" onClick={resetLocalChanges}>Reset Local Changes</Button>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <Card className="flex items-center justify-between"><div><p className="text-sm text-slate-500">Live Exams</p><p className="text-2xl font-bold">{liveRows.length}</p></div><Radio className="text-emerald-700" /></Card>
        <Card className="flex items-center justify-between"><div><p className="text-sm text-slate-500">All Exams</p><p className="text-2xl font-bold">{rows.length}</p></div><PlayCircle className="text-primary" /></Card>
        <Card className="flex items-center justify-between"><div><p className="text-sm text-slate-500">Selected Exam</p><p className="text-2xl font-bold">{selectedCode || "None"}</p></div><Badge>{status || "All Statuses"}</Badge></Card>
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
            <tr className={`border-t border-border ${selectedCode === exam.code ? "bg-muted/60" : ""}`} key={exam.code} onClick={() => { setSelectedCode(exam.code); setSelectedExamId(exam.id); setAdminSelectedExamCode(exam.code); }}>
              <td className="p-3 font-semibold">{exam.code}</td>
              <td className="p-3">{exam.name}</td>
              <td className="p-3">{exam.department}</td>
              <td className="p-3"><Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950">{exam.phase}</Badge></td>
              <td className="p-3">{exam.dates}</td>
              <td className="p-3">{exam.applications}</td>
              <td className="p-3"><Badge className={isLiveStatus(exam.status) ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950" : ""}>{statusLabel(exam.status)}</Badge></td>
              <td className="p-3"><div className="flex gap-2"><Button className="h-8 w-8 bg-emerald-600 px-0" onClick={(event) => { event.stopPropagation(); makeLive(exam.code); }} title="Go Live"><PlayCircle size={15} /></Button><Button className="h-8 w-8 px-0" onClick={(event) => { event.stopPropagation(); editExam(exam.code); }} title="Edit"><Pencil size={15} /></Button><Button className="h-8 w-8 bg-secondary px-0" onClick={(event) => { event.stopPropagation(); cloneExam(exam.code); }} title="Clone"><Copy size={15} /></Button><Button className="h-8 w-8 bg-destructive px-0" onClick={(event) => { event.stopPropagation(); deleteExam(exam.code); }} title="Archive"><Trash2 size={15} /></Button></div></td>
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
