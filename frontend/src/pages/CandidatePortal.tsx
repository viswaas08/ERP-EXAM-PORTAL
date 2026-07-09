import { CheckCircle2, FileText, Upload } from "lucide-react";
import { Link } from "react-router-dom";
import { Button, Card, Input, Select } from "../components/ui";

const steps = ["Personal Details", "Address", "Education", "Experience", "Preferences", "Documents", "Preview", "Submit"];

export function CandidatePortal() {
  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h1 className="text-2xl font-bold">Candidate Registration</h1><p className="text-sm text-slate-500">Multi-step application wizard generated from admin-configured fields.</p></div>
          <Link to="/candidate"><Button>Open Dashboard</Button></Link>
        </div>
        <Card className="grid gap-2 md:grid-cols-8">{steps.map((step, i) => <div className="rounded-md bg-muted p-3 text-sm font-semibold" key={step}>{i + 1}. {step}</div>)}</Card>
        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <Card className="space-y-4">
            <h2 className="font-semibold">Personal Details</h2>
            <div className="grid gap-3 md:grid-cols-2"><Input placeholder="Full name" /><Input placeholder="Email" /><Input placeholder="Phone" /><Input type="date" /><Select><option>Indian</option></Select><Select><option>General</option><option>OBC</option><option>SC</option><option>ST</option></Select></div>
            <h2 className="font-semibold">Education</h2>
            <div className="grid gap-3 md:grid-cols-2"><Select><option>Bachelor's Degree</option></Select><Input placeholder="University" /><Input placeholder="Percentage" /><Input placeholder="Passing year" /></div>
            <h2 className="font-semibold">Document Upload</h2>
            <div className="grid gap-3 md:grid-cols-3">{["Photo", "Signature", "Degree Certificate"].map((item) => <div className="grid h-28 place-items-center rounded-md border border-dashed border-border text-sm" key={item}><Upload size={20} />{item}</div>)}</div>
            <Button><FileText size={18} /> Preview and Final Submit</Button>
          </Card>
          <Card>
            <h2 className="mb-4 font-semibold">Eligibility Preview</h2>
            {["Age within limit", "Qualification matched", "Percentage eligible", "Documents pending"].map((item, i) => <div className="mb-3 flex items-center gap-2 text-sm" key={item}><CheckCircle2 className={i === 3 ? "text-amber-600" : "text-emerald-600"} size={18} />{item}</div>)}
            <div className="mt-6 rounded-md bg-muted p-4 text-sm">Application Number will be generated after final submission with acknowledgement PDF.</div>
          </Card>
        </div>
      </div>
    </main>
  );
}
