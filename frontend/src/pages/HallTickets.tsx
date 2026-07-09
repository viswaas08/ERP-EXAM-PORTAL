import { FileDown, QrCode, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { applications } from "../data/demo";
import { Badge, Button, Card, Table } from "../components/ui";
import { usePersistentState } from "../lib/usePersistentState";
import { api } from "../lib/api";

type DbApplication = {
  id: string;
  applicationNo: string;
  status: string;
  candidate: { user: { name: string } };
  examination: { code: string; name: string };
};

export function HallTickets() {
  const [generated, setGenerated] = usePersistentState("examPortal.hallTickets.generated", 0);
  const [notice, setNotice] = usePersistentState("examPortal.hallTickets.notice", "Hall ticket batch is ready.");
  const [regenerated, setRegenerated] = usePersistentState<string[]>("examPortal.hallTickets.regenerated", []);
  const [dbRows, setDbRows] = useState<DbApplication[]>([]);

  useEffect(() => {
    api<DbApplication[]>("/applications")
      .then((data) => {
        if (data && data.length > 0) {
          setDbRows(data);
          setNotice(`Loaded ${data.length} candidate application(s) from database.`);
        }
      })
      .catch(() => {
        setNotice("Loaded local candidate applications (demo mode).");
      });
  }, []);

  const displayRows = dbRows.length > 0
    ? dbRows.map((app) => ({
        id: app.applicationNo,
        name: app.candidate.user.name,
        exam: app.examination.code,
        status: app.status
      }))
    : applications;

  function bulkGenerate() {
    setGenerated((value) => value + displayRows.length);
    setNotice(`${displayRows.length} pending hall tickets generated with QR and barcode values.`);
  }

  function downloadTicket(id: string) {
    const content = `Hall Ticket\nApplication: ${id}\nReporting Time: 08:30 AM\nCentre: Assigned CBT Centre`;
    const url = URL.createObjectURL(new Blob([content], { type: "text/plain" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${id}-hall-ticket.txt`;
    link.click();
    URL.revokeObjectURL(url);
    setNotice(`${id} hall ticket downloaded.`);
  }

  return (
    <section className="space-y-5">
      <Card className="border-l-4 border-l-primary py-3 text-sm font-medium">{notice}</Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold">Hall Ticket Management</h1><p className="text-sm text-slate-500">Generate roll numbers, seat numbers, QR codes, barcodes, centres, and PDFs.</p></div>
        <Button onClick={bulkGenerate}><QrCode size={18} /> Bulk Generate</Button>
      </div>
      <Card className="grid gap-3 md:grid-cols-4">
        {[`${generated} Generated`, `${Math.max(0, displayRows.length - generated)} Pending`, "30 Centres", "100% QR Ready"].map((item) => (
          <div className="rounded-md bg-muted p-4 font-semibold" key={item}>{item}</div>
        ))}
      </Card>
      <Table>
        <thead className="bg-muted">
          <tr>{["Application", "Candidate", "Exam", "Roll No", "Reporting", "Status", "Actions"].map((h) => <th className="p-3" key={h}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {displayRows.slice(0, 8).map((app, i) => (
            <tr className="border-t border-border" key={app.id}>
              <td className="p-3 font-semibold">{app.id}</td>
              <td className="p-3">{app.name}</td>
              <td className="p-3">{app.exam}</td>
              <td className="p-3">26{String(i + 1).padStart(6, "0")}</td>
              <td className="p-3">08:30 AM</td>
              <td className="p-3">
                <Badge>{regenerated.includes(app.id) ? "Regenerated" : "Generated"}</Badge>
              </td>
              <td className="p-3">
                <div className="flex gap-2">
                  <Button className="h-8 w-8 px-0" onClick={() => downloadTicket(app.id)} title="Download Ticket"><FileDown size={15} /></Button>
                  <Button className="h-8 w-8 bg-secondary px-0" onClick={() => { setRegenerated((current) => [...new Set([...current, app.id])]); setNotice(`${app.id} regenerated.`); }} title="Regenerate"><RefreshCw size={15} /></Button>
                </div>
              </td>
            </tr>
          ))}
          {!displayRows.length && (
            <tr><td className="p-6 text-center text-slate-500" colSpan={7}>No applications are available for hall ticket generation.</td></tr>
          )}
        </tbody>
      </Table>
    </section>
  );
}
