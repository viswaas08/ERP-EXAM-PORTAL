import { Check, Download, Search, X } from "lucide-react";
import { Badge, Button, Card } from "../components/ui";

const docs = ["Passport Photo", "Signature", "Identity Proof", "Degree Certificate", "Category Certificate", "Experience Certificate"];

export function Verification() {
  return (
    <section className="space-y-5">
      <div><h1 className="text-2xl font-bold">Document Verification</h1><p className="text-sm text-slate-500">Preview, zoom, approve, reject, and remark candidate documents.</p></div>
      <div className="grid gap-4 lg:grid-cols-3">
        {docs.map((doc, index) => (
          <Card key={doc}>
            <div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">{doc}</h2><Badge>{index % 3 === 0 ? "Pending" : "Verified"}</Badge></div>
            <div className="grid h-36 place-items-center rounded-md border border-dashed border-border bg-muted text-sm text-slate-500">Document Preview</div>
            <textarea className="mt-3 min-h-20 w-full rounded-md border border-border bg-background p-3 text-sm" placeholder="Add remarks" />
            <div className="mt-3 flex gap-2"><Button className="flex-1 bg-emerald-600"><Check size={16} /> Approve</Button><Button className="flex-1 bg-destructive"><X size={16} /> Reject</Button><Button className="w-10 px-0 bg-secondary"><Search size={16} /></Button><Button className="w-10 px-0"><Download size={16} /></Button></div>
          </Card>
        ))}
      </div>
    </section>
  );
}
