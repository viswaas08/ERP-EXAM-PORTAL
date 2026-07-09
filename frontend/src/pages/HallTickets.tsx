import { FileDown, QrCode, RefreshCw } from "lucide-react";
import { applications } from "../data/demo";
import { Badge, Button, Card, Table } from "../components/ui";

export function HallTickets() {
  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-bold">Hall Ticket Management</h1><p className="text-sm text-slate-500">Generate roll numbers, seat numbers, QR codes, barcodes, centres, and PDFs.</p></div><Button><QrCode size={18} /> Bulk Generate</Button></div>
      <Card className="grid gap-3 md:grid-cols-4">{["500 Generated", "18 Pending", "30 Centres", "100% QR Ready"].map((item) => <div className="rounded-md bg-muted p-4 font-semibold" key={item}>{item}</div>)}</Card>
      <Table><thead className="bg-muted"><tr>{["Application", "Roll No", "Seat", "Centre", "Reporting", "Status", "Actions"].map((h) => <th className="p-3" key={h}>{h}</th>)}</tr></thead><tbody>{applications.slice(0, 8).map((app, i) => <tr className="border-t border-border" key={app.id}><td className="p-3 font-semibold">{app.id}</td><td className="p-3">26{String(i + 1).padStart(6, "0")}</td><td className="p-3">L{i + 1}-S{12 + i}</td><td className="p-3">Centre {i + 1}</td><td className="p-3">08:30 AM</td><td className="p-3"><Badge>Generated</Badge></td><td className="p-3"><div className="flex gap-2"><Button className="h-8 w-8 px-0"><FileDown size={15} /></Button><Button className="h-8 w-8 bg-secondary px-0"><RefreshCw size={15} /></Button></div></td></tr>)}</tbody></Table>
    </section>
  );
}
