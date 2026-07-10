import { Download, Eye, Filter, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, Input, Select, Table } from "../components/ui";
import { api } from "../lib/api";
import { usePersistentState } from "../lib/usePersistentState";

type ApplicationRow = {
  id: string;
  applicationNo: string;
  status: string;
  candidate: { user: { name: string; email?: string }; profile?: { phone?: string; category?: string; qualification?: string; state?: string; district?: string; percentage?: number } | null };
  examination: { id: string; code: string; name: string };
  documents?: Array<{ type: string; status: string }>;
};

type ExamOption = {
  id: string;
  code: string;
  name: string;
};

export function Applications() {
  const [rows, setRows] = useState<ApplicationRow[]>([]);
  const [exams, setExams] = useState<ExamOption[]>([]);
  const [query, setQuery] = useState("");
  const [selectedExamId, setSelectedExamId] = usePersistentState<string | undefined>("examPortal.examinations.selectedExamId", undefined);
  const [status, setStatus] = useState("All Statuses");
  const [selectedId, setSelectedId] = useState("");
  const [notice, setNotice] = useState("Applications loading from database...");

  async function loadExams() {
    try {
      const data = await api<ExamOption[]>("/examinations");
      setExams(data);
    } catch {
      setNotice("Could not load examinations list.");
    }
  }

  async function loadApplications(preferredSelectedId = selectedId) {
    const queryString = selectedExamId ? `?examId=${encodeURIComponent(selectedExamId)}` : "";
    try {
      const data = await api<ApplicationRow[]>(`/applications${queryString}`);
      setRows(data);
      setSelectedId(data.some((app) => app.id === preferredSelectedId) ? preferredSelectedId : data[0]?.id ?? "");
      setNotice(`${data.length} application(s) loaded${selectedExamId ? " for the selected examination" : ""}.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not load applications.");
    }
  }

  useEffect(() => {
    void loadExams();
  }, []);

  useEffect(() => {
    void loadApplications();
  }, [selectedExamId]);

  const filteredRows = useMemo(() => rows.filter((app) => {
    const text = `${app.applicationNo} ${app.candidate.user.name}`.toLowerCase();
    const queryMatch = text.includes(query.toLowerCase());
    const statusMatch = status === "All Statuses" || app.status === status.toUpperCase();
    return queryMatch && statusMatch;
  }), [rows, query, status]);

  const selected = rows.find((app) => app.id === selectedId);

  function exportCsv() {
    const csv = ["Application,Candidate,Exam,Status", ...filteredRows.map((app) => `${app.applicationNo},${app.candidate.user.name},${app.examination.code},${app.status}`)].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "applications.csv";
    link.click();
    URL.revokeObjectURL(url);
    setNotice(`Exported ${filteredRows.length} application(s) to CSV.`);
  }

  async function updateStatus(id: string, nextStatus: string) {
    try {
      const updated = await api<ApplicationRow>(`/applications/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus, remarks: `Marked ${nextStatus} from admin portal` })
      });
      setRows((current) => current.map((app) => app.id === id ? updated : app));
      setSelectedId(id);
      setStatus("All Statuses");
      setNotice(`${updated.applicationNo} updated to ${updated.status} in the database.`);
      await loadApplications(id);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Application status could not be updated.");
    }
  }

  return (
    <section className="space-y-5">
      <Card className="border-l-4 border-l-primary py-3 text-sm font-medium">{notice}</Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Application Management</h1>
          <p className="text-sm text-slate-500">Review candidate applications and scrutinize documents.</p>
        </div>
        <Button onClick={exportCsv}><Download size={18} /> Export</Button>
      </div>
      
      <Card className="grid gap-3 md:grid-cols-5">
        <Input placeholder="Search candidate" value={query} onChange={(event) => setQuery(event.target.value)} />
        
        <Select value={selectedExamId || ""} onChange={(event) => setSelectedExamId(event.target.value || undefined)}>
          <option value="">All Examinations</option>
          {exams.map((exam) => <option key={exam.id} value={exam.id}>{exam.code} - {exam.name}</option>)}
        </Select>

        <Select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option>All Statuses</option>
          <option>PENDING</option>
          <option>APPROVED</option>
          <option>RETURNED</option>
          <option>REJECTED</option>
          <option>HOLD</option>
        </Select>
        
        <Button className="bg-secondary" onClick={() => setNotice(`${filteredRows.length} application(s) found.`)}>
          <Filter size={18} /> Filter
        </Button>
      </Card>

      {selected && (
        <Card>
          <h2 className="mb-2 font-semibold">Review Panel</h2>
          <p className="text-sm">
            {selected.candidate.user.name} | {selected.applicationNo} | {selected.examination.code} | Current status: <strong>{selected.status}</strong>
          </p>
          <div className="mt-3 grid gap-2 text-sm md:grid-cols-4">
            <p><strong>Email:</strong> {selected.candidate.user.email ?? "Not available"}</p>
            <p><strong>Category:</strong> {selected.candidate.profile?.category ?? "Not set"}</p>
            <p><strong>Qualification:</strong> {selected.candidate.profile?.qualification ?? "Not set"}</p>
            <p><strong>District:</strong> {selected.candidate.profile?.district ?? "Not set"}</p>
            <p><strong>Percentage:</strong> {selected.candidate.profile?.percentage ?? 0}</p>
            <p><strong>Documents:</strong> {selected.documents?.length ?? 0}</p>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button className="bg-emerald-600" onClick={() => updateStatus(selected.id, "APPROVED")}>Approve</Button>
            <Button className="bg-destructive" onClick={() => updateStatus(selected.id, "REJECTED")}>Reject</Button>
            <Button className="bg-secondary" onClick={() => updateStatus(selected.id, "RETURNED")}>Return For Correction</Button>
          </div>
        </Card>
      )}

      <Table>
        <thead className="bg-muted">
          <tr>{["Application", "Candidate", "Exam", "Status", "Action"].map((h) => <th className="p-3" key={h}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {filteredRows.map((app) => (
            <tr className={`border-t border-border ${selectedId === app.id ? "bg-muted/60" : ""}`} key={app.id}>
              <td className="p-3 font-semibold">{app.applicationNo}</td>
              <td className="p-3">{app.candidate.user.name}</td>
              <td className="p-3">{app.examination.code}</td>
              <td className="p-3"><Badge>{app.status}</Badge></td>
              <td className="p-3">
                <div className="flex gap-2">
                  <Button className="h-8 w-8 px-0" onClick={() => { setSelectedId(app.id); setNotice(`${app.applicationNo} opened in review panel.`); }}><Eye size={15} /></Button>
                  <Button className="h-8 w-8 bg-secondary px-0" onClick={() => updateStatus(app.id, "RETURNED")}><RotateCcw size={15} /></Button>
                </div>
              </td>
            </tr>
          ))}
          {!filteredRows.length && (
            <tr>
              <td className="p-6 text-center text-slate-500" colSpan={5}>
                No candidate applications found in the database.
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    </section>
  );
}
