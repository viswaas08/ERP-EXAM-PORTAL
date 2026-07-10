import { FileDown, QrCode, RefreshCw, Layers, CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge, Button, Card, Table, Select } from "../components/ui";
import { usePersistentState } from "../lib/usePersistentState";
import { API_URL, api } from "../lib/api";

type ExamOption = {
  id: string;
  code: string;
  name: string;
};

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
  const [notice, setNotice] = useState("Select an examination to manage hall tickets.");
  const [regenerated, setRegenerated] = usePersistentState<string[]>("examPortal.hallTickets.regenerated", []);
  const [dbRows, setDbRows] = useState<DbApplication[]>([]);
  const [tickets, setTickets] = useState<HallTicketRow[]>([]);
  const [exams, setExams] = useState<ExamOption[]>([]);
  const [selectedExamId, setSelectedExamId] = usePersistentState<string>("examPortal.hallTickets.selectedExamId", "");
  const [loading, setLoading] = useState(false);

  async function loadExams() {
    try {
      const data = await api<ExamOption[]>("/examinations");
      setExams(data);
      if (data.length > 0 && !selectedExamId) {
        setSelectedExamId(data[0].id);
      }
    } catch {
      setNotice("Could not load examinations list.");
    }
  }

  async function loadHallTicketData(examId = selectedExamId) {
    if (!examId) return;
    setLoading(true);
    try {
      const [applications, hallTickets] = await Promise.all([
        api<DbApplication[]>(`/applications?examId=${encodeURIComponent(examId)}`),
        api<HallTicketRow[]>(`/hall-tickets?examId=${encodeURIComponent(examId)}`)
      ]);
      setDbRows(applications);
      setTickets(hallTickets);
      setNotice(`${hallTickets.length} hall ticket(s) loaded for this examination.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not load hall ticket data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadExams();
  }, []);

  useEffect(() => {
    if (selectedExamId) {
      void loadHallTicketData(selectedExamId);
    }
  }, [selectedExamId]);

  async function bulkGenerate() {
    if (!selectedExamId) {
      alert("Please select an examination first.");
      return;
    }
    setLoading(true);
    try {
      const result = await api<{ generated: number; message?: string }>("/hall-tickets/generate", {
        method: "POST",
        body: JSON.stringify({ examId: selectedExamId })
      });
      setNotice(result.message ?? `${result.generated} hall ticket(s) generated successfully.`);
      await loadHallTicketData(selectedExamId);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Hall ticket generation failed.");
    } finally {
      setLoading(false);
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

  const approvedCount = dbRows.filter((app) => app.status === "APPROVED").length;

  return (
    <section className="space-y-5">
      {/* Notice Banner */}
      <Card className="border-l-4 border-l-primary py-3 text-sm font-semibold bg-primary/5 text-primary flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
        {notice}
      </Card>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Hall Ticket Management</h1>
          <p className="text-sm text-slate-500">Generate roll numbers, seat assignments, and PDFs on an exam-by-exam basis.</p>
        </div>
        <div className="flex items-center gap-3">
          <Select className="min-w-64" value={selectedExamId} onChange={(e) => setSelectedExamId(e.target.value)}>
            <option value="">Select target exam...</option>
            {exams.map((exam) => (
              <option key={exam.id} value={exam.id}>
                {exam.code} - {exam.name}
              </option>
            ))}
          </Select>
          <Button onClick={bulkGenerate} disabled={loading || !selectedExamId}>
            <QrCode size={18} /> Bulk Generate
          </Button>
        </div>
      </div>

      {selectedExamId ? (
        <>
          <Card className="grid gap-3 md:grid-cols-4">
            <div className="rounded-md bg-slate-50 border border-slate-100 p-4 font-semibold text-slate-700">
              <span className="text-[10px] text-slate-400 font-medium block uppercase tracking-wider">Tickets Generated</span>
              <span className="text-lg font-bold">{tickets.length}</span>
            </div>
            <div className="rounded-md bg-slate-50 border border-slate-100 p-4 font-semibold text-slate-700">
              <span className="text-[10px] text-slate-400 font-medium block uppercase tracking-wider">Approved Candidates</span>
              <span className="text-lg font-bold">{approvedCount}</span>
            </div>
            <div className="rounded-md bg-slate-50 border border-slate-100 p-4 font-semibold text-slate-700">
              <span className="text-[10px] text-slate-400 font-medium block uppercase tracking-wider">Generation Status</span>
              <span className="text-lg font-bold">{approvedCount - tickets.length} Pending</span>
            </div>
            <div className="rounded-md bg-slate-50 border border-slate-100 p-4 font-semibold text-slate-700">
              <span className="text-[10px] text-slate-400 font-medium block uppercase tracking-wider">PDF Templates</span>
              <span className="text-lg font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle size={16} /> Ready
              </span>
            </div>
          </Card>

          <Table>
            <thead className="bg-muted">
              <tr>
                {["Application", "Candidate", "Exam Code", "Roll Number", "Reporting", "Status", "Actions"].map((h) => (
                  <th className="p-3" key={h}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => (
                <tr className="border-t border-border hover:bg-slate-50/50" key={ticket.id}>
                  <td className="p-3 font-semibold text-slate-800">{ticket.application.applicationNo}</td>
                  <td className="p-3">{ticket.application.candidate.user.name}</td>
                  <td className="p-3">{ticket.application.examination.code}</td>
                  <td className="p-3 font-mono font-semibold text-slate-600">{ticket.rollNumber}</td>
                  <td className="p-3 text-slate-500">{new Date(ticket.reportingTime).toLocaleString()}</td>
                  <td className="p-3">
                    <Badge className={regenerated.includes(ticket.id) ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}>
                      {regenerated.includes(ticket.id) ? "Regenerated" : "Generated"}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <Button className="h-8 w-8 px-0" onClick={() => downloadTicket(ticket)} title="Download Ticket">
                        <FileDown size={15} />
                      </Button>
                      <Button
                        className="h-8 w-8 bg-secondary px-0 text-slate-600 hover:text-slate-900 border-slate-200"
                        onClick={() => {
                          setRegenerated((current) => [...new Set([...current, ticket.id])]);
                          setNotice(`${ticket.application.applicationNo} marked for regeneration.`);
                        }}
                        title="Regenerate"
                      >
                        <RefreshCw size={15} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {!tickets.length && (
                <tr>
                  <td className="p-10 text-center text-slate-400" colSpan={7}>
                    No hall tickets have been generated for this examination yet. Click "Bulk Generate" to assign seats and roll numbers.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </>
      ) : (
        <Card className="text-center py-16 border-2 border-dashed rounded-lg text-slate-400">
          Please select an examination from the dropdown list above to view or generate hall tickets.
        </Card>
      )}
    </section>
  );
}
