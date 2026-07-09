import { FileDown, QrCode, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge, Button, Card, Table } from "../components/ui";
import { API_URL, api } from "../lib/api";

type TicketRow = {
  id: string;
  rollNumber: string;
  seatNumber: string;
  reportingTime: string;
  centre: { name: string; city: string; state: string };
  application: {
    applicationNo: string;
    candidate: { user: { name: string } };
    examination: { code: string };
  };
};

export function HallTickets() {
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [notice, setNotice] = useState("Hall tickets load from the database.");

  async function loadTickets() {
    try {
      const data = await api<TicketRow[]>("/hall-tickets");
      setTickets(data);
      setNotice(`${data.length} hall ticket(s) loaded from database.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not load hall tickets.");
    }
  }

  useEffect(() => {
    void loadTickets();
  }, []);

  async function bulkGenerate() {
    try {
      const result = await api<{ generated: number; message?: string }>("/hall-tickets/generate", { method: "POST", body: JSON.stringify({}) });
      setNotice(result.message ?? `${result.generated} hall ticket(s) generated using Tamil Nadu centres.`);
      await loadTickets();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Hall ticket generation failed.");
    }
  }

  async function downloadTicket(ticket: TicketRow) {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`${API_URL}/api/hall-tickets/${ticket.id}.pdf`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!response.ok) throw new Error("PDF download failed");
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = `${ticket.application.applicationNo}-hall-ticket.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      setNotice(`${ticket.application.applicationNo} hall ticket PDF downloaded.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Hall ticket PDF download failed.");
    }
  }

  return (
    <section className="space-y-5">
      <Card className="border-l-4 border-l-primary py-3 text-sm font-medium">{notice}</Card>
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-bold">Hall Ticket Management</h1><p className="text-sm text-slate-500">Generate hall tickets for approved applications using Tamil Nadu examination centres.</p></div><div className="flex gap-2"><Button onClick={bulkGenerate}><QrCode size={18} /> Generate Approved</Button><Button className="bg-secondary" onClick={loadTickets}><RefreshCw size={18} /> Refresh</Button></div></div>
      <Card className="grid gap-3 md:grid-cols-4">{[`${tickets.length} Generated`, "Tamil Nadu Centres", "QR/Barcode Ready", "Approved Only"].map((item) => <div className="rounded-md bg-muted p-4 font-semibold" key={item}>{item}</div>)}</Card>
      <Table><thead className="bg-muted"><tr>{["Application", "Candidate", "Roll No", "Seat", "Centre", "Reporting", "Status", "Actions"].map((h) => <th className="p-3" key={h}>{h}</th>)}</tr></thead><tbody>{tickets.map((ticket) => <tr className="border-t border-border" key={ticket.id}><td className="p-3 font-semibold">{ticket.application.applicationNo}</td><td className="p-3">{ticket.application.candidate.user.name}</td><td className="p-3">{ticket.rollNumber}</td><td className="p-3">{ticket.seatNumber}</td><td className="p-3">{ticket.centre.city}</td><td className="p-3">{new Date(ticket.reportingTime).toLocaleString()}</td><td className="p-3"><Badge>Generated</Badge></td><td className="p-3"><Button className="h-8 w-8 px-0" onClick={() => downloadTicket(ticket)}><FileDown size={15} /></Button></td></tr>)}{!tickets.length && <tr><td className="p-6 text-center text-slate-500" colSpan={8}>No hall tickets generated yet. Approve applications first, then generate.</td></tr>}</tbody></Table>
    </section>
  );
}
