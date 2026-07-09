import { Play, Plus } from "lucide-react";
import { useState } from "react";
import { Badge, Button, Card, Select } from "../components/ui";
import { usePersistentState } from "../lib/usePersistentState";
const fields = ["Qualification", "Percentage", "Age", "Nationality", "Category", "Documents Verified", "Experience Years", "State", "Application Status"];
const operators = ["equals", "not equals", "greater than", "greater than or equal", "less than", "less than or equal", "contains", "is empty", "is not empty"];
const values = ["Bachelor's Degree", "B.Tech", "60", "70", "30", "Indian", "General", "OBC", "Yes", "No", "Pending", "Approved"];
const connectors = ["AND", "OR", "NOT", "THEN Approve", "THEN Reject", "THEN Manual Queue", "THEN Return For Correction"];

export function EligibilityRules() {
  const [rules, setRules] = usePersistentState("examPortal.rules.items", ["Auto Approval", "Manual Queue"]);
  const [preview, setPreview] = usePersistentState("examPortal.rules.preview", ["318 Auto Approved", "122 Manual Verification", "34 Returned", "26 Rejected"]);
  const [notice, setNotice] = usePersistentState("examPortal.rules.notice", "Rules are ready for simulation.");

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
              <Select>{fields.map((item) => <option key={item}>{item}</option>)}</Select><Select>{operators.map((item) => <option key={item}>{item}</option>)}</Select><Select>{values.map((item) => <option key={item}>{item}</option>)}</Select><Select>{connectors.map((item) => <option key={item}>{item}</option>)}</Select>
              <Select>{fields.map((item) => <option key={item}>{item}</option>)}</Select><Select>{operators.map((item) => <option key={item}>{item}</option>)}</Select><Select>{values.map((item) => <option key={item}>{item}</option>)}</Select><Select>{connectors.map((item) => <option key={item}>{item}</option>)}</Select>
              <Select>{fields.map((item) => <option key={item}>{item}</option>)}</Select><Select>{operators.map((item) => <option key={item}>{item}</option>)}</Select><Select>{values.map((item) => <option key={item}>{item}</option>)}</Select><Select>{connectors.map((item) => <option key={item}>{item}</option>)}</Select>
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
