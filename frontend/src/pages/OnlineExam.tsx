import { Flag, Save, Send } from "lucide-react";
import { Button, Card } from "../components/ui";

const numbers = Array.from({ length: 30 }, (_, i) => i + 1);

export function OnlineExam() {
  return (
    <main className="min-h-screen bg-background">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card p-4"><div><h1 className="font-bold">National Recruitment Examination</h1><p className="text-sm text-slate-500">Section A: General Studies</p></div><div className="rounded-md bg-destructive px-4 py-2 font-bold text-white">01:24:36</div></header>
      <div className="grid gap-4 p-4 lg:grid-cols-[1fr_320px]">
        <Card>
          <div className="mb-4 flex items-center justify-between"><h2 className="font-semibold">Question 12</h2><span className="text-sm text-slate-500">Marks 2, Negative 0.5</span></div>
          <p className="mb-5 text-lg font-semibold">Which constitutional body conducts recruitment examinations for civil services in India?</p>
          <div className="space-y-3">{["Election Commission", "Union Public Service Commission", "Finance Commission", "Planning Commission"].map((option, i) => <label className="flex items-center gap-3 rounded-md border border-border p-4" key={option}><input name="answer" type="radio" defaultChecked={i === 1} />{option}</label>)}</div>
          <div className="mt-6 flex flex-wrap gap-2"><Button className="bg-secondary"><Save size={18} /> Save & Next</Button><Button><Flag size={18} /> Mark For Review</Button><Button className="bg-destructive"><Send size={18} /> Submit</Button></div>
        </Card>
        <Card>
          <h2 className="mb-4 font-semibold">Question Palette</h2>
          <div className="grid grid-cols-5 gap-2">{numbers.map((n) => <button className={`h-10 rounded-md text-sm font-bold ${n < 12 ? "bg-emerald-600 text-white" : n === 12 ? "bg-primary text-white" : "bg-muted"}`} key={n}>{n}</button>)}</div>
          <div className="mt-5 space-y-2 text-sm"><p>Attempted: 11</p><p>Skipped: 4</p><p>Marked for review: 2</p><p>Auto saved: just now</p></div>
        </Card>
      </div>
    </main>
  );
}
