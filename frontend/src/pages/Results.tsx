import { Award, Calculator, Download, Upload } from "lucide-react";
import { useState } from "react";
import { applications } from "../data/demo";
import { Badge, Button, Card, Table } from "../components/ui";

export function Results() {
  const [published, setPublished] = useState(false);
  const [notice, setNotice] = useState("Results are calculated but not published.");
  const [offset, setOffset] = useState(0);

  function downloadScoreCard(name: string) {
    const content = `Score Card\nCandidate: ${name}\nStatus: Qualified\nPublished: ${published ? "Yes" : "No"}`;
    const url = URL.createObjectURL(new Blob([content], { type: "text/plain" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${name.replaceAll(" ", "-")}-score-card.txt`;
    link.click();
    URL.revokeObjectURL(url);
    setNotice(`${name} score card downloaded.`);
  }

  return (
    <section className="space-y-5">
      <Card className="border-l-4 border-l-primary py-3 text-sm font-medium">{notice}</Card>
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-bold">Result Management</h1><p className="text-sm text-slate-500">Evaluate, normalize, publish, hold, recalculate, and export merit lists.</p></div><div className="flex gap-2"><Button className="bg-secondary" onClick={() => { setOffset((value) => value + 2); setNotice("Results recalculated and ranks refreshed."); }}><Calculator size={18} /> Recalculate</Button><Button onClick={() => { setPublished(true); setNotice("Results published to candidate dashboards."); }}><Upload size={18} /> Publish</Button></div></div>
      <Card className="grid gap-3 md:grid-cols-4">{["432 Evaluated", "318 Qualified", published ? "0 Held" : "24 Held", "6 Lists Ready"].map((item) => <div className="rounded-md bg-muted p-4 font-semibold" key={item}>{item}</div>)}</Card>
      <Table><thead className="bg-muted"><tr>{["Candidate", "Marks", "Percentage", "Rank", "Percentile", "Result", "Score Card"].map((h) => <th className="p-3" key={h}>{h}</th>)}</tr></thead><tbody>{applications.slice(0, 10).map((app, i) => <tr className="border-t border-border" key={app.id}><td className="p-3 font-semibold">{app.name}</td><td className="p-3">{122 + i * 3 + offset}/200</td><td className="p-3">{app.score + offset}%</td><td className="p-3">{i + 1}</td><td className="p-3">{98 - i * 2}</td><td className="p-3"><Badge>{i < 7 ? "Qualified" : "Not Qualified"}</Badge></td><td className="p-3"><Button className="h-8 bg-secondary" onClick={() => downloadScoreCard(app.name)}><Download size={15} /> PDF</Button></td></tr>)}</tbody></Table>
    </section>
  );
}
