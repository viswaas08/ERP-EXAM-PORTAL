import { FileDown, QrCode, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge, Button, Card, Table } from "../components/ui";
import { usePersistentState } from "../lib/usePersistentState";
import { API_URL, api } from "../lib/api";

type DbApplication = {
  id: string;
  applicationNo: string;
  status: string;
  candidate: { user: { name: string } };
  examination: { code: string; name: string };
};

type HallTicketRow = {
  id: string;
  rollNumber: string;
  seatNumber: string;
  reportingTime: string;
  application: DbApplication;
  centre: { name: string; city: string; state: string };
};

export function HallTickets() {
  const [notice, setNotice] = usePersistentState("examPortal.hallTickets.notice", "Hall ticket batch is ready.");
  const [regenerated, setRegenerated] = usePersistentState<string[]>("examPortal.hallTickets.regenerated", []);
  const [dbRows, setDbRows] = useState<DbApplication[]>([]);
  const [tickets, setTickets] = useState<HallTicketRow[]>([]);

  async function loadHallTicketData() {
    try {
      const [applications, hallTickets] = await Promise.all([
        api<DbApplication[]>("/applications"),
        api<HallTicketRow[]>("/hall-tickets")
      ]);
      setDbRows(applications);
      setTickets(hallTickets);
      setNotice(`${hallTickets.length} hall ticket(s) loaded from database.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not load hall ticket data.");
    }
  }

  useEffect(() => {
    void loadHallTicketData();
  }, []);

  async function bulkGenerate() {
    try {
      const result = await api<{ generated: number; message?: string }>("/hall-tickets/generate", { method: "POST", body: JSON.stringify({}) });
      setNotice(result.message ?? `${result.generated} hall ticket(s) generated in the database.`);
      await loadHallTicketData();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Hall ticket generation failed.");
    }
  }

  async function downloadTicket(ticket: HallTicketRow) {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`${API_URL}/api/hall-tickets/${ticket.id}.pdf`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!response.ok) throw new Error("Hall ticket PDF download failed");
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = `${ticket.application.applicationNo}-hall-ticket.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      setNotice(`${ticket.application.applicationNo} hall ticket downloaded.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Hall ticket download failed.");
    }
  }

  return (
    <section className="space-y-5">
      <Card className="border-l-4 border-l-primary py-3 text-sm font-medium">{notice}</Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold">Hall Ticket Management</h1><p className="text-sm text-slate-500">Generate roll numbers, seat numbers, QR codes, barcodes, centres, and PDFs.</p></div>
        <Button onClick={bulkGenerate}><QrCode size={18} /> Bulk Generate</Button>
      </div>
      <Card className="grid gap-3 md:grid-cols-4">
        {[`${tickets.length} Generated`, `${dbRows.filter((app) => app.status === "APPROVED").length} Approved`, "38 Centres", "PDF Ready"].map((item) => (
          <div className="rounded-md bg-muted p-4 font-semibold" key={item}>{item}</div>
        ))}
      </Card>
      <Table>
        <thead className="bg-muted">
          <tr>{["Application", "Candidate", "Exam", "Roll No", "Reporting", "Status", "Actions"].map((h) => <th className="p-3" key={h}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {tickets.map((ticket) => (
            <tr className="border-t border-border" key={ticket.id}>
              <td className="p-3 font-semibold">{ticket.application.applicationNo}</td>
              <td className="p-3">{ticket.application.candidate.user.name}</td>
              <td className="p-3">{ticket.application.examination.code}</td>
              <td className="p-3">{ticket.rollNumber}</td>
              <td className="p-3">{new Date(ticket.reportingTime).toLocaleString()}</td>
              <td className="p-3">
                <Badge>{regenerated.includes(ticket.id) ? "Regenerated" : "Generated"}</Badge>
              </td>
              <td className="p-3">
                <div className="flex gap-2">
                  <Button className="h-8 w-8 px-0" onClick={() => downloadTicket(ticket)} title="Download Ticket"><FileDown size={15} /></Button>
                  <Button className="h-8 w-8 bg-secondary px-0" onClick={() => { setRegenerated((current) => [...new Set([...current, ticket.id])]); setNotice(`${ticket.application.applicationNo} marked for regeneration.`); }} title="Regenerate"><RefreshCw size={15} /></Button>
                </div>
              </td>
            </tr>
          ))}
          {!tickets.length && (
            <tr><td className="p-6 text-center text-slate-500" colSpan={7}>No applications are available for hall ticket generation.</td></tr>
          )}
        </tbody>
      </Table>
    </section>
  );
}
