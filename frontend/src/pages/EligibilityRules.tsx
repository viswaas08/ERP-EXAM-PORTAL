import { Play, Plus } from "lucide-react";
import { useState } from "react";
import { Badge, Button, Card, Select } from "../components/ui";

export function EligibilityRules() {
  const [rules, setRules] = useState(["Auto Approval", "Manual Queue"]);
  const [preview, setPreview] = useState(["318 Auto Approved", "122 Manual Verification", "34 Returned", "26 Rejected"]);
  const [notice, setNotice] = useState("Rules are ready for simulation.");

  function simulate() {
    setPreview(["342 Auto Approved", "101 Manual Verification", "39 Returned", "18 Rejected"]);
    setNotice("Simulation completed against the current applicant pool.");
  }

  function addRule() {
    const next = `Custom Rule ${rules.length + 1}`;
    setRules((current) => [...current, next]);
    setNotice(`${next} added with lowest priority.`);
  }

  return (
    <section className="space-y-5">
      <Card className="border-l-4 border-l-primary py-3 text-sm font-medium">{notice}</Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold">Eligibility Rule Engine</h1><p className="text-sm text-slate-500">Build nested rules, simulate results, and execute bulk decisions.</p></div>
        <div className="flex gap-2"><Button className="bg-secondary" onClick={simulate}><Play size={18} /> Simulate</Button><Button onClick={addRule}><Plus size={18} /> New Rule</Button></div>
      </div>
      <Card>
        <div className="space-y-3">
          <div className="rounded-md border border-border p-4">
            <div className="mb-3 flex items-center gap-2"><Badge>IF</Badge><Badge>Priority 1</Badge><Badge>Auto Approval</Badge></div>
            <div className="grid gap-3 md:grid-cols-4">
              <Select><option>Qualification</option></Select><Select><option>equals</option></Select><Select><option>Bachelor's Degree</option></Select><Select><option>AND</option></Select>
              <Select><option>Percentage</option></Select><Select><option>greater than or equal</option></Select><Select><option>60</option></Select><Select><option>AND</option></Select>
              <Select><option>Age</option></Select><Select><option>less than or equal</option></Select><Select><option>30</option></Select><Select><option>THEN Approve</option></Select>
            </div>
          </div>
          <div className="rounded-md border border-border p-4">
            <div className="mb-3 flex items-center gap-2"><Badge>IF</Badge><Badge>Priority 2</Badge><Badge>Manual Queue</Badge></div>
            <p className="text-sm">Category certificate missing OR document confidence below threshold THEN Return for correction.</p>
          </div>
          {rules.slice(2).map((rule) => <div className="rounded-md border border-border p-4" key={rule}><div className="mb-3 flex items-center gap-2"><Badge>IF</Badge><Badge>{rule}</Badge><Badge>Draft</Badge></div><p className="text-sm">New nested condition group ready for configuration.</p></div>)}
        </div>
      </Card>
      <Card>
        <h2 className="mb-3 font-semibold">Bulk Execution Preview</h2>
        <div className="grid gap-3 md:grid-cols-4">
          {preview.map((item) => <div className="rounded-md bg-muted p-4 font-semibold" key={item}>{item}</div>)}
        </div>
      </Card>
    </section>
  );
}
