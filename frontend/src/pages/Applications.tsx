import { Download, Eye, Filter, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";
import { applications } from "../data/demo";
import { Badge, Button, Card, Input, Select, Table } from "../components/ui";

export function Applications() {
  const [rows, setRows] = useState(applications);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All Statuses");
  const [category, setCategory] = useState("All Categories");
  const [selectedId, setSelectedId] = useState(rows[0]?.id ?? "");
  const [notice, setNotice] = useState("Select an application to review candidate details.");

  const filteredRows = useMemo(() => rows.filter((app) => {
    const queryMatch = `${app.name} ${app.id}`.toLowerCase().includes(query.toLowerCase());
    const statusMatch = status === "All Statuses" || app.status === status;
    const categoryMatch = category === "All Categories" || app.category === category;
    return queryMatch && statusMatch && categoryMatch;
  }), [rows, query, status, category]);

  const selected = rows.find((app) => app.id === selectedId);

  function exportCsv() {
    const csv = ["Application,Candidate,Exam,Category,State,Score,Status", ...filteredRows.map((app) => `${app.id},${app.name},${app.exam},${app.category},${app.state},${app.score},${app.status}`)].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "applications.csv";
    link.click();
    URL.revokeObjectURL(url);
    setNotice(`Exported ${filteredRows.length} application(s) to CSV.`);
  }

  function returnForCorrection(id: string) {
    setRows((current) => current.map((app) => app.id === id ? { ...app, status: "Returned" } : app));
    setSelectedId(id);
    setNotice(`${id} returned for correction with remarks.`);
  }

  return (
    <section className="space-y-5">
      <Card className="border-l-4 border-l-primary py-3 text-sm font-medium">{notice}</Card>
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-bold">Application Management</h1><p className="text-sm text-slate-500">Search, filter, bulk process, export, and review candidate records.</p></div><Button onClick={exportCsv}><Download size={18} /> Export</Button></div>
      <Card className="grid gap-3 md:grid-cols-5"><Input placeholder="Search candidate" value={query} onChange={(event) => setQuery(event.target.value)} /><Select><option>All Exams</option><option>NRE-2026</option><option>SET-2026</option><option>TEC-2026</option><option>University Entrance Test</option><option>Public Service Preliminary</option></Select><Select value={status} onChange={(event) => setStatus(event.target.value)}><option>All Statuses</option><option>Approved</option><option>Pending</option><option>Returned</option><option>Rejected</option><option>Hold</option><option>Correction Required</option><option>Hall Ticket Ready</option><option>Result Published</option></Select><Select value={category} onChange={(event) => setCategory(event.target.value)}><option>All Categories</option><option>General</option><option>OBC</option><option>SC</option><option>ST</option><option>EWS</option><option>PwD</option><option>Ex-Servicemen</option></Select><Button className="bg-secondary" onClick={() => setNotice(`${filteredRows.length} application(s) found.`)}><Filter size={18} /> Filter</Button></Card>
      {selected && <Card><h2 className="mb-2 font-semibold">Review Panel</h2><p className="text-sm">{selected.name} · {selected.id} · {selected.exam} · Current status: <strong>{selected.status}</strong></p></Card>}
      <Table>
        <thead className="bg-muted"><tr>{["Application", "Candidate", "Exam", "Category", "State", "Score", "Status", "Action"].map((h) => <th className="p-3" key={h}>{h}</th>)}</tr></thead>
        <tbody>{filteredRows.map((app) => <tr className={`border-t border-border ${selectedId === app.id ? "bg-muted/60" : ""}`} key={app.id}><td className="p-3 font-semibold">{app.id}</td><td className="p-3">{app.name}</td><td className="p-3">{app.exam}</td><td className="p-3">{app.category}</td><td className="p-3">{app.state}</td><td className="p-3">{app.score}%</td><td className="p-3"><Badge>{app.status}</Badge></td><td className="p-3"><div className="flex gap-2"><Button className="h-8 w-8 px-0" onClick={() => { setSelectedId(app.id); setNotice(`${app.id} opened in review panel.`); }}><Eye size={15} /></Button><Button className="h-8 w-8 bg-secondary px-0" onClick={() => returnForCorrection(app.id)}><RotateCcw size={15} /></Button></div></td></tr>)}{!filteredRows.length && <tr><td className="p-6 text-center text-slate-500" colSpan={8}>No candidate applications are seeded. New submissions will appear here.</td></tr>}</tbody>
      </Table>
    </section>
  );
}
