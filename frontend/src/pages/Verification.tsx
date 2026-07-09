import { Check, Download, Search, X } from "lucide-react";
import { useState } from "react";
import { Badge, Button, Card } from "../components/ui";
import { usePersistentState } from "../lib/usePersistentState";

const docs = ["Passport Photo", "Signature", "Identity Proof", "Degree Certificate", "Category Certificate", "Experience Certificate"];

export function Verification() {
  const [statuses, setStatuses] = usePersistentState<Record<string, string>>("examPortal.verification.statuses", Object.fromEntries(docs.map((doc, index) => [doc, index % 3 === 0 ? "Pending" : "Verified"])));
  const [previewDoc, setPreviewDoc] = usePersistentState("examPortal.verification.previewDoc", "Passport Photo");
  const [notice, setNotice] = usePersistentState("examPortal.verification.notice", "Open a document preview, then approve or reject it.");
  const [remarks, setRemarks] = usePersistentState<Record<string, string>>("examPortal.verification.remarks", {});

  function updateStatus(doc: string, status: string) {
    setStatuses((current) => ({ ...current, [doc]: status }));
    setNotice(`${doc} marked ${status}.`);
  }

  function downloadDoc(doc: string) {
    const url = URL.createObjectURL(new Blob([`${doc} verification file\nStatus: ${statuses[doc]}`], { type: "text/plain" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${doc.replaceAll(" ", "-")}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    setNotice(`${doc} downloaded.`);
  }

  return (
    <section className="space-y-5">
      <Card className="border-l-4 border-l-primary py-3 text-sm font-medium">{notice}</Card>
      <div><h1 className="text-2xl font-bold">Document Verification</h1><p className="text-sm text-slate-500">Preview, zoom, approve, reject, and remark candidate documents.</p></div>
      <Card><h2 className="mb-2 font-semibold">Active Preview</h2><div className="grid h-40 place-items-center rounded-md border border-dashed border-border bg-muted text-sm text-slate-500">{previewDoc} preview is open</div></Card>
      <div className="grid gap-4 lg:grid-cols-3">
        {docs.map((doc, index) => (
          <Card key={doc}>
            <div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">{doc}</h2><Badge>{statuses[doc]}</Badge></div>
            <div className="grid h-36 place-items-center rounded-md border border-dashed border-border bg-muted text-sm text-slate-500">Document Preview</div>
            <textarea className="mt-3 min-h-20 w-full rounded-md border border-border bg-background p-3 text-sm" placeholder="Add remarks" value={remarks[doc] ?? ""} onChange={(event) => setRemarks((current) => ({ ...current, [doc]: event.target.value }))} />
            <div className="mt-3 flex gap-2"><Button className="flex-1 bg-emerald-600" onClick={() => updateStatus(doc, "Approved")}><Check size={16} /> Approve</Button><Button className="flex-1 bg-destructive" onClick={() => updateStatus(doc, "Rejected")}><X size={16} /> Reject</Button><Button className="w-10 px-0 bg-secondary" onClick={() => { setPreviewDoc(doc); setNotice(`${doc} opened in zoom preview.`); }}><Search size={16} /></Button><Button className="w-10 px-0" onClick={() => downloadDoc(doc)}><Download size={16} /></Button></div>
          </Card>
        ))}
      </div>
    </section>
  );
}
