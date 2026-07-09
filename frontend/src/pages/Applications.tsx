import { Download, Eye, Filter, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, Input, Select, Table } from "../components/ui";
import { api } from "../lib/api";

type ApplicationRow = {
  id: string;
  applicationNo: string;
  status: string;
  candidate: { user: { name: string }; profile?: { category?: string; state?: string; percentage?: number } | null };
  examination: { code: string; name: string };
};

export function Applications() {
  const [rows, setRows] = useState<ApplicationRow[]>([]);
  const [query, setQuery] = useState("");
  const [examFilter, setExamFilter] = useState("All Exams");
  const [status, setStatus] = useState("All Statuses");
  const [selectedId, setSelectedId] = useState("");
  const [notice, setNotice] = useState("Applications load from the database.");

  useEffect(() => {
    api<ApplicationRow[]>("/applications")
      .then((data) => {
        setRows(data);
        setSelectedId(data[0]?.id ?? "");
        setNotice(`${data.length} database application(s) loaded.`);
      })
      .catch((error) => setNotice(error instanceof Error ? error.message : "Could not load applications."));
  }, []);

  const filteredRows = useMemo(() => rows.filter((app) => {
    const text = `${app.applicationNo} ${app.candidate.user.name}`.toLowerCase();
    const queryMatch = text.includes(query.toLowerCase());
    const examMatch = examFilter === "All Exams" || app.examination.code === examFilter;
    const statusMatch = status === "All Statuses" || app.status === status.toUpperCase();
    return queryMatch && examMatch && statusMatch;
  }), [rows, query, examFilter, status]);

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
    const updated = await api<{ id: string; status: string }>(`/applications/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: nextStatus, remarks: `Marked ${nextStatus} from admin portal` })
    });
    setRows((current) => current.map((app) => app.id === id ? { ...app, status: updated.status } : app));
    setSelectedId(id);
    setNotice(`Application status updated to ${nextStatus}.`);
  }

  return (
    <section className="space-y-5">
      <Card className="border-l-4 border-l-primary py-3 text-sm font-medium">{notice}</Card>
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-bold">Application Management</h1><p className="text-sm text-slate-500">Database-backed application review and export.</p></div><Button onClick={exportCsv}><Download size={18} /> Export</Button></div>
      <Card className="grid gap-3 md:grid-cols-5"><Input placeholder="Search candidate" value={query} onChange={(event) => setQuery(event.target.value)} /><Select value={examFilter} onChange={(event) => setExamFilter(event.target.value)}><option>All Exams</option>{[...new Set(rows.map((app) => app.examination.code))].map((code) => <option key={code}>{code}</option>)}</Select><Select value={status} onChange={(event) => setStatus(event.target.value)}><option>All Statuses</option><option>PENDING</option><option>APPROVED</option><option>RETURNED</option><option>REJECTED</option><option>HOLD</option></Select><Button className="bg-secondary" onClick={() => setNotice(`${filteredRows.length} application(s) found.`)}><Filter size={18} /> Filter</Button></Card>
      {selected && <Card><h2 className="mb-2 font-semibold">Review Panel</h2><p className="text-sm">{selected.candidate.user.name} · {selected.applicationNo} · {selected.examination.code} · Current status: <strong>{selected.status}</strong></p><div className="mt-3 flex flex-wrap gap-2"><Button className="bg-emerald-600" onClick={() => updateStatus(selected.id, "APPROVED")}>Approve</Button><Button className="bg-destructive" onClick={() => updateStatus(selected.id, "REJECTED")}>Reject</Button><Button className="bg-secondary" onClick={() => updateStatus(selected.id, "RETURNED")}>Return For Correction</Button></div></Card>}
      <Table>
        <thead className="bg-muted"><tr>{["Application", "Candidate", "Exam", "Status", "Action"].map((h) => <th className="p-3" key={h}>{h}</th>)}</tr></thead>
        <tbody>{filteredRows.map((app) => <tr className={`border-t border-border ${selectedId === app.id ? "bg-muted/60" : ""}`} key={app.id}><td className="p-3 font-semibold">{app.applicationNo}</td><td className="p-3">{app.candidate.user.name}</td><td className="p-3">{app.examination.code}</td><td className="p-3"><Badge>{app.status}</Badge></td><td className="p-3"><div className="flex gap-2"><Button className="h-8 w-8 px-0" onClick={() => { setSelectedId(app.id); setNotice(`${app.applicationNo} opened in review panel.`); }}><Eye size={15} /></Button><Button className="h-8 w-8 bg-secondary px-0" onClick={() => updateStatus(app.id, "RETURNED")}><RotateCcw size={15} /></Button></div></td></tr>)}{!filteredRows.length && <tr><td className="p-6 text-center text-slate-500" colSpan={5}>No candidate applications found in the database.</td></tr>}</tbody>
      </Table>
    </section>
  );
}
