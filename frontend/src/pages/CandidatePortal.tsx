import { CheckCircle2, FileText, LogOut, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Button, Card, Input, Select } from "../components/ui";
import { fallbackPhase, getCandidatePhase, type CandidatePhaseSnapshot } from "../lib/workflow";
import { usePersistentState } from "../lib/usePersistentState";
import { upsertStoredApplication } from "../lib/erpStorage";

const steps = ["Personal Details", "Address", "Education", "Experience", "Preferences", "Documents", "Preview", "Submit"];
const nationalities = ["Indian", "Nepalese", "Bhutanese", "OCI", "Other"];
const categories = ["General", "OBC", "SC", "ST", "EWS", "PwD", "Ex-Servicemen"];
const qualifications = ["Bachelor's Degree", "Master's Degree", "B.Tech", "B.Sc", "B.Com", "BA", "Diploma", "PhD", "12th Pass"];
const exams = ["National Recruitment Examination", "State Eligibility Test", "Technical Engineer Cadre", "University Entrance Test", "Public Service Preliminary"];
const centres = ["Pune Digital Campus", "Delhi North CBT Lab", "Bengaluru South Centre", "Chennai Knowledge Park", "Jaipur Public School", "Kochi Test Hub", "Ahmedabad Digital Centre"];

export function CandidatePortal() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = usePersistentState("examPortal.candidateRegistration.activeStep", 0);
  const [submitted, setSubmitted] = usePersistentState("examPortal.candidateRegistration.submitted", false);
  const [uploadedDocs, setUploadedDocs] = usePersistentState<string[]>("examPortal.candidateRegistration.uploadedDocs", []);
  const [notice, setNotice] = usePersistentState("examPortal.candidateRegistration.notice", "Complete each step and preview before final submission.");
  const [phase, setPhase] = useState<CandidatePhaseSnapshot>(fallbackPhase);
  const [form, setForm] = usePersistentState("examPortal.candidateRegistration.form", {
    name: "Demo Candidate",
    email: "candidate@exam.gov",
    phone: "9876543210",
    university: "State University",
    percentage: "72",
    year: "2025"
  });

  useEffect(() => {
    getCandidatePhase()
      .then((snapshot) => {
        setPhase(snapshot);
        setNotice(`${snapshot.exam.name}: active phase is ${snapshot.activePhase?.name ?? "Not scheduled"}.`);
      })
      .catch(() => setNotice("Using demo phase state because the workflow API is not reachable."));
  }, []);

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function uploadDoc(doc: string) {
    setUploadedDocs((current) => current.includes(doc) ? current : [...current, doc]);
    setNotice(`${doc} uploaded successfully.`);
  }

  function nextStep() {
    if (!phase.access.registration && !phase.access.correction) {
      setNotice(`Registration is locked during ${phase.activePhase?.name ?? "the current phase"}.`);
      return;
    }
    if (activeStep < steps.length - 1) {
      setActiveStep((step) => step + 1);
      setNotice(`${steps[activeStep + 1]} is now active.`);
      return;
    }
    setSubmitted(true);
    upsertStoredApplication({
      id: "APP-2026-000501",
      name: form.name,
      exam: "NRE-2026",
      category: "General",
      state: "Maharashtra",
      score: Number(form.percentage) || 0,
      status: "Pending"
    });
    setNotice("Application APP-2026-000501 submitted and acknowledgement generated.");
  }

  function downloadAcknowledgement() {
    const content = `Application Acknowledgement\nApplication No: APP-2026-000501\nCandidate: ${form.name}\nEmail: ${form.email}\nStatus: Submitted`;
    const url = URL.createObjectURL(new Blob([content], { type: "text/plain" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "application-acknowledgement.txt";
    link.click();
    URL.revokeObjectURL(url);
    setNotice("Acknowledgement downloaded.");
  }

  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-5">
        <Card className="border-l-4 border-l-primary py-3 text-sm font-medium">{notice}</Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h1 className="text-2xl font-bold">Candidate Registration</h1><p className="text-sm text-slate-500">Current phase: {phase.activePhase?.name ?? "Loading"}</p></div>
          <div className="flex flex-wrap gap-2">
            <Link to="/candidate"><Button>Open Dashboard</Button></Link>
            {isAuthenticated ? (
              <Button className="bg-destructive" onClick={handleLogout}><LogOut size={18} /> Logout</Button>
            ) : (
              <Link to="/login"><Button className="bg-secondary">Login</Button></Link>
            )}
          </div>
        </div>
        <Card className="grid gap-2 md:grid-cols-8">{steps.map((step, i) => <button className={`rounded-md p-3 text-left text-sm font-semibold ${i === activeStep ? "bg-primary text-white" : i < activeStep || submitted ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950" : "bg-muted"}`} key={step} onClick={() => { setActiveStep(i); setNotice(`${step} opened.`); }}>{i + 1}. {step}</button>)}</Card>
        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <Card className="space-y-4">
            <h2 className="font-semibold">{steps[activeStep]}</h2>
            {activeStep <= 1 && <div className="grid gap-3 md:grid-cols-2"><Input placeholder="Full name" value={form.name} onChange={(event) => updateField("name", event.target.value)} /><Input placeholder="Email" value={form.email} onChange={(event) => updateField("email", event.target.value)} /><Input placeholder="Phone" value={form.phone} onChange={(event) => updateField("phone", event.target.value)} /><Input type="date" /><Select>{nationalities.map((item) => <option key={item}>{item}</option>)}</Select><Select>{categories.map((item) => <option key={item}>{item}</option>)}</Select></div>}
            {activeStep === 2 && <div className="grid gap-3 md:grid-cols-2"><Select>{qualifications.map((item) => <option key={item}>{item}</option>)}</Select><Input placeholder="University" value={form.university} onChange={(event) => updateField("university", event.target.value)} /><Input placeholder="Percentage" value={form.percentage} onChange={(event) => updateField("percentage", event.target.value)} /><Input placeholder="Passing year" value={form.year} onChange={(event) => updateField("year", event.target.value)} /></div>}
            {activeStep === 3 && <textarea className="min-h-28 w-full rounded-md border border-border bg-background p-3 text-sm" placeholder="Experience details, if any" />}
            {activeStep === 4 && <div className="grid gap-3 md:grid-cols-2"><Select>{exams.map((item) => <option key={item}>{item}</option>)}</Select><Select>{centres.map((item) => <option key={item}>{item}</option>)}</Select></div>}
            {activeStep === 5 && <div className="grid gap-3 md:grid-cols-3">{["Photo", "Signature", "Degree Certificate"].map((item) => <button className={`grid h-28 place-items-center rounded-md border border-dashed border-border text-sm ${uploadedDocs.includes(item) ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950" : ""}`} key={item} onClick={() => uploadDoc(item)}><Upload size={20} />{uploadedDocs.includes(item) ? `${item} Uploaded` : item}</button>)}</div>}
            {activeStep >= 6 && <div className="rounded-md bg-muted p-4 text-sm"><p><strong>Name:</strong> {form.name}</p><p><strong>Email:</strong> {form.email}</p><p><strong>Education:</strong> Bachelor's Degree, {form.percentage}%</p><p><strong>Documents:</strong> {uploadedDocs.length}/3 uploaded</p><p><strong>Status:</strong> {submitted ? "Submitted" : "Ready for final submission"}</p></div>}
            <div className="flex flex-wrap gap-2">
              <Button className="bg-secondary" onClick={() => setActiveStep((step) => Math.max(0, step - 1))}>Back</Button>
              <Button onClick={nextStep} disabled={!phase.access.registration && !phase.access.correction}><FileText size={18} /> {activeStep === steps.length - 1 ? "Final Submit" : "Save & Next"}</Button>
              {submitted && <Button className="bg-emerald-600" onClick={downloadAcknowledgement}>Download Acknowledgement</Button>}
            </div>
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
