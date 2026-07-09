import { CheckCircle2, FileText, LogOut, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Button, Card, Input, Select } from "../components/ui";
import { fallbackPhase, getCandidatePhase, getLiveExams, type CandidatePhaseSnapshot, type LiveExam } from "../lib/workflow";
import { usePersistentState } from "../lib/usePersistentState";
import { api } from "../lib/api";
import { tamilNaduDistrictCentres } from "../data/tamilNaduDistricts";

const steps = ["Personal Details", "Address", "Education", "Experience", "Preferences", "Documents", "Preview", "Submit"];
const nationalities = ["Indian", "Nepalese", "Bhutanese", "OCI", "Other"];
const categories = ["General", "OBC", "SC", "ST", "EWS", "PwD", "Ex-Servicemen"];
const qualifications = ["Bachelor's Degree", "Master's Degree", "B.Tech", "B.Sc", "B.Com", "BA", "Diploma", "PhD", "12th Pass"];
export function CandidatePortal() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = usePersistentState("examPortal.candidateRegistration.v2.activeStep", 0);
  const [submitted, setSubmitted] = usePersistentState("examPortal.candidateRegistration.v2.submitted", false);
  const [applicationNo, setApplicationNo] = usePersistentState("examPortal.candidateRegistration.v2.applicationNo", "");
  const [uploadedDocs, setUploadedDocs] = usePersistentState<string[]>("examPortal.candidateRegistration.v2.uploadedDocs", []);
  const [notice, setNotice] = usePersistentState("examPortal.candidateRegistration.v2.notice", "Complete each step and preview before final submission.");
  const [phase, setPhase] = useState<CandidatePhaseSnapshot>(fallbackPhase);
  const [liveExams, setLiveExams] = useState<LiveExam[]>([]);
  const [form, setForm] = usePersistentState("examPortal.candidateRegistration.v2.form", {
    name: "",
    email: "",
    password: "",
    phone: "",
    dateOfBirth: "",
    nationality: "Indian",
    category: "General",
    qualification: "Bachelor's Degree",
    university: "",
    percentage: "",
    year: "",
    exam: "",
    centre: "Chennai",
    address: "",
    experience: ""
  });

  useEffect(() => {
    getLiveExams()
      .then((items) => {
        setLiveExams(items);
        const firstLiveExam = items[0];
        if (!form.exam && firstLiveExam) {
          updateField("exam", firstLiveExam.id);
        }
        setNotice(items.length ? `${items.length} live examination(s) are open for registration.` : "No live examinations are open for registration.");
      })
      .catch(() => setNotice("Could not load live examinations. Registration will unlock when the backend is available."));
  }, []);

  useEffect(() => {
    if (!form.exam) return;
    getCandidatePhase(form.exam)
      .then((snapshot) => {
        setPhase(snapshot);
        setNotice(`${snapshot.exam.code}: active phase is ${snapshot.activePhase?.name ?? "Not scheduled"}.`);
      })
      .catch(() => setNotice("Could not reach the workflow service for the selected examination."));
  }, [form.exam]);

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

  async function nextStep() {
    if (!phase.access.registration && !phase.access.correction) {
      setNotice(`Registration is locked during ${phase.activePhase?.name ?? "the current phase"}.`);
      return;
    }
    if (activeStep < steps.length - 1) {
      setActiveStep((step) => step + 1);
      setNotice(`${steps[activeStep + 1]} is now active.`);
      return;
    }
    if (!isAuthenticated && form.password.length < 8) {
      setNotice("Create a password with at least 8 characters before final submission.");
      return;
    }
    try {
      const selectedCity = tamilNaduDistrictCentres.find((item) => item.city === form.centre) ?? tamilNaduDistrictCentres[0];
      const selectedExam = liveExams.find((item) => item.id === form.exam);
      if (!selectedExam) {
        setNotice("Select a live examination before final submission.");
        return;
      }
      const endpoint = isAuthenticated ? "/candidate/registration" : "/candidate/public-registration";
      const application = await api<{ applicationNo: string; candidateLogin?: { email: string } }>(endpoint, {
        method: "POST",
        body: JSON.stringify({
          ...form,
          exam: selectedExam.id,
          documents: uploadedDocs,
          state: "Tamil Nadu",
          district: selectedCity.district,
          address: form.address || "Candidate address"
        })
      });
      setApplicationNo(application.applicationNo);
      setSubmitted(true);
      setNotice(
        isAuthenticated
          ? `Application ${application.applicationNo} saved in Neon database.`
          : `Application ${application.applicationNo} saved. Login with ${application.candidateLogin?.email ?? form.email} to open the candidate dashboard.`
      );
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Registration could not be saved to database.");
    }
  }

  function downloadAcknowledgement() {
    const content = `Application Acknowledgement\nApplication No: ${applicationNo || "Pending"}\nCandidate: ${form.name}\nEmail: ${form.email}\nStatus: ${submitted ? "Submitted" : "Draft"}`;
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
            {activeStep === 0 && <div className="grid gap-3 md:grid-cols-2"><Input placeholder="Full name" value={form.name} onChange={(event) => updateField("name", event.target.value)} /><Input placeholder="Email" value={form.email} onChange={(event) => updateField("email", event.target.value)} />{!isAuthenticated && <Input placeholder="Create password" type="password" value={form.password} onChange={(event) => updateField("password", event.target.value)} />}<Input placeholder="Phone" value={form.phone} onChange={(event) => updateField("phone", event.target.value)} /></div>}
            {activeStep === 1 && <div className="grid gap-3 md:grid-cols-2"><Input type="date" value={form.dateOfBirth} onChange={(event) => updateField("dateOfBirth", event.target.value)} /><Select value={form.nationality} onChange={(event) => updateField("nationality", event.target.value)}>{nationalities.map((item) => <option key={item}>{item}</option>)}</Select><Select value={form.category} onChange={(event) => updateField("category", event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</Select><Select value={form.centre} onChange={(event) => updateField("centre", event.target.value)}>{tamilNaduDistrictCentres.map((item) => <option key={item.district} value={item.city}>{item.district} - {item.city}</option>)}</Select><textarea className="min-h-24 rounded-md border border-border bg-background p-3 text-sm md:col-span-2" placeholder="Address" value={form.address} onChange={(event) => updateField("address", event.target.value)} /></div>}
            {activeStep === 2 && <div className="grid gap-3 md:grid-cols-2"><Select value={form.qualification} onChange={(event) => updateField("qualification", event.target.value)}>{qualifications.map((item) => <option key={item}>{item}</option>)}</Select><Input placeholder="University" value={form.university} onChange={(event) => updateField("university", event.target.value)} /><Input placeholder="Percentage" value={form.percentage} onChange={(event) => updateField("percentage", event.target.value)} /><Input placeholder="Passing year" value={form.year} onChange={(event) => updateField("year", event.target.value)} /></div>}
            {activeStep === 3 && <textarea className="min-h-28 w-full rounded-md border border-border bg-background p-3 text-sm" placeholder="Experience details, if any" value={form.experience} onChange={(event) => updateField("experience", event.target.value)} />}
            {activeStep === 4 && <div className="grid gap-3 md:grid-cols-2"><Select value={form.exam} onChange={(event) => updateField("exam", event.target.value)}>{liveExams.length ? liveExams.map((item) => <option key={item.id} value={item.id}>{item.code} - {item.name}</option>) : <option value="">No live examinations</option>}</Select><Select value={form.centre} onChange={(event) => updateField("centre", event.target.value)}>{tamilNaduDistrictCentres.map((item) => <option key={item.district} value={item.city}>{item.district} - {item.city}</option>)}</Select></div>}
            {activeStep === 5 && <div className="grid gap-3 md:grid-cols-3">{["Photo", "Signature", "Degree Certificate"].map((item) => <button className={`grid h-28 place-items-center rounded-md border border-dashed border-border text-sm ${uploadedDocs.includes(item) ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950" : ""}`} key={item} onClick={() => uploadDoc(item)}><Upload size={20} />{uploadedDocs.includes(item) ? `${item} Uploaded` : item}</button>)}</div>}
            {activeStep >= 6 && <div className="rounded-md bg-muted p-4 text-sm"><p><strong>Name:</strong> {form.name}</p><p><strong>Email:</strong> {form.email}</p><p><strong>Education:</strong> {form.qualification}, {form.percentage}%</p><p><strong>Preference:</strong> {liveExams.find((item) => item.id === form.exam)?.code ?? "Select exam"}, {form.centre}</p><p><strong>Documents:</strong> {uploadedDocs.length}/3 uploaded</p><p><strong>Application No:</strong> {applicationNo || "Will be generated on submit"}</p><p><strong>Status:</strong> {submitted ? "Submitted to database" : "Ready for final submission"}</p></div>}
            <div className="flex flex-wrap gap-2">
              <Button className="bg-secondary" onClick={() => setActiveStep((step) => Math.max(0, step - 1))}>Back</Button>
              <Button onClick={nextStep} disabled={(!phase.access.registration && !phase.access.correction) || !liveExams.length}><FileText size={18} /> {activeStep === steps.length - 1 ? "Final Submit" : "Save & Next"}</Button>
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
