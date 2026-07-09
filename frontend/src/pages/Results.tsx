import { FileDown, RefreshCw, Trophy } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, Select, Table } from "../components/ui";
import { usePersistentState } from "../lib/usePersistentState";
import { API_URL, api } from "../lib/api";

type DbApplication = {
  id: string;
  applicationNo: string;
  status: string;
  candidate: { user: { name?: string | null; email?: string | null } };
  examination: { code: string; name: string };
};

type ResultRow = {
  id: string;
  marks: number;
  percentage: number;
  rank: number;
  qualified: boolean;
  status: string;
  application: DbApplication;
  candidateName?: string | null;
  candidateEmail?: string | null;
};

type ExaminationRow = {
  id: string;
  code: string;
  name: string;
  status: string;
  applications: number;
  submissions: number;
  results: number;
  activePhase?: { name: string; status: string } | null;
};

type SubmissionResponse = {
  question: {
    id: string;
    prompt: string;
    marks: number;
    negativeMarks: number;
    options: Array<{ id: string; text: string; isCorrect?: boolean }>;
  };
  answer: { optionId?: string } | null;
  marked: boolean;
};

type SubmissionRow = {
  id: string;
  examId: string;
  status: string;
  submittedAt: string | null;
  applicationId: string;
  application: DbApplication | null;
  candidateName?: string | null;
  candidateEmail?: string | null;
  responses: SubmissionResponse[];
};

function displayCandidateName(row: { candidateName?: string | null; candidateEmail?: string | null; application?: DbApplication | null }) {
  return row.candidateName?.trim()
    || row.application?.candidate.user.name?.trim()
    || row.candidateEmail
    || row.application?.candidate.user.email
    || "Unknown Candidate";
}

export function Results() {
  const [notice, setNotice] = usePersistentState("examPortal.results.notice", "Results are calculated. Ready for publishing.");
  const [dbRows, setDbRows] = useState<DbApplication[]>([]);
  const [results, setResults] = useState<ResultRow[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [exams, setExams] = useState<ExaminationRow[]>([]);
  const [selectedExamId, setSelectedExamId] = usePersistentState<string | undefined>("examPortal.examinations.selectedExamId", undefined);
  const [selectedSubmissionId, setSelectedSubmissionId] = usePersistentState("examPortal.results.selectedSubmissionId", "");

  async function loadResults() {
    try {
      const examRows = await api<ExaminationRow[]>("/results/exams");
      const nextExamId = examRows.some((exam) => exam.id === selectedExamId) ? selectedExamId : examRows[0]?.id;
      if (nextExamId !== selectedExamId) {
        setSelectedExamId(nextExamId);
      }

      const query = nextExamId ? `?examId=${encodeURIComponent(nextExamId)}` : "";
      const [applications, resultRows, submissionRows] = await Promise.all([
        api<DbApplication[]>(`/applications${query}`),
        api<ResultRow[]>(`/results${query}`),
        api<SubmissionRow[]>(`/results/submissions${query}`)
      ]);
      setDbRows(applications);
      setResults(resultRows);
      setSubmissions(submissionRows);
      setExams(examRows);
      setSelectedSubmissionId((current) => {
        if (submissionRows.some((item) => item.id === current)) return current;
        return submissionRows[0]?.id ?? "";
      });
      const selectedExam = examRows.find((exam) => exam.id === nextExamId);
      setNotice(selectedExam ? `${selectedExam.code}: ${submissionRows.length} submitted answer sheet(s), ${resultRows.length} result(s).` : "No live examination is available for result processing.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not load result data.");
    }
  }

  useEffect(() => {
    void loadResults();
  }, [selectedExamId]);

  const selectedSubmission = useMemo(() => submissions.find((item) => item.id === selectedSubmissionId) ?? submissions[0] ?? null, [submissions, selectedSubmissionId]);
  const selectedExam = useMemo(() => exams.find((exam) => exam.id === selectedExamId) ?? null, [exams, selectedExamId]);

  async function recalculate() {
    if (!selectedExamId) {
      setNotice("Select a live examination before evaluating submitted answers.");
      return;
    }
    try {
      const evaluated = await api<{ evaluated: number }>("/results/evaluate", { method: "POST", body: JSON.stringify({ examId: selectedExamId ?? "" }) });
      setNotice(`${evaluated.evaluated} submitted exam(s) evaluated in the database.`);
      await loadResults();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Result evaluation failed.");
    }
  }

  async function publishResults() {
    if (!selectedExamId) {
      setNotice("Select a live examination before publishing results.");
      return;
    }
    try {
      const published = await api<{ published: number; activePhase?: { name: string } | null }>("/results/publish", { method: "POST", body: JSON.stringify({ examId: selectedExamId ?? "" }) });
      setNotice(`${published.published} result(s) published live to candidate portal. Phase changed to ${published.activePhase?.name ?? "Result Publication"}.`);
      await loadResults();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Result publication failed.");
    }
  }

  async function downloadScorecard(result: ResultRow) {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`${API_URL}/api/results/${result.id}/score-card.pdf`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!response.ok) throw new Error("Score card PDF download failed");
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = `${result.application.applicationNo}-score-card.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      setNotice(`${result.application.applicationNo} score card downloaded.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Score card download failed.");
    }
  }

  return (
    <section className="space-y-5">
      <Card className="border-l-4 border-l-primary py-3 text-sm font-medium">{notice}</Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold">Results Processing</h1><p className="text-sm text-slate-500">Calculate normalized scores, compile merit lists, and publish candidate score cards.</p></div>
        <div className="flex flex-wrap items-center gap-2">
          <Select className="min-w-56" value={selectedExamId ?? ""} onChange={(event) => setSelectedExamId(event.target.value || undefined)}>
            <option value="">Select live exam</option>
            {exams.map((exam) => <option key={exam.id} value={exam.id}>{exam.code} - {exam.name} ({exam.submissions} submitted)</option>)}
          </Select>
          <Button className="bg-secondary" disabled={!selectedExamId} onClick={recalculate}><RefreshCw size={18} /> Evaluate</Button>
          <Button disabled={!selectedExamId || !results.length} onClick={publishResults}><Trophy size={18} /> Publish Results</Button>
        </div>
      </div>
      {selectedExam && <Card className="grid gap-3 md:grid-cols-4">
        {[
          `Selected: ${selectedExam.code}`,
          `Phase: ${selectedExam.activePhase?.name ?? "Not scheduled"}`,
          `Submitted: ${selectedExam.submissions}`,
          `Results: ${selectedExam.results}`
        ].map((item) => <div className="rounded-md bg-muted p-4 font-semibold" key={item}>{item}</div>)}
      </Card>}
      <Card className="grid gap-3 md:grid-cols-4">
        {["Applications: " + dbRows.length, "Evaluated: " + results.length, "Passed: " + results.filter((result) => result.qualified).length, "Published: " + results.filter((result) => result.status === "PUBLISHED").length].map((item) => (
          <div className="rounded-md bg-muted p-4 font-semibold" key={item}>{item}</div>
        ))}
      </Card>
      <Table>
        <thead className="bg-muted">
          <tr>{["Application", "Candidate", "Exam", "Score", "Result", "Actions"].map((h) => <th className="p-3" key={h}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {results.map((result) => {
            return (
              <tr className="border-t border-border" key={result.id}>
                <td className="p-3 font-semibold">{result.application.applicationNo}</td>
                <td className="p-3">{displayCandidateName(result)}</td>
                <td className="p-3">{result.application.examination.code}</td>
                <td className="p-3 font-semibold">{result.marks}</td>
                <td className="p-3">
                  <Badge className={result.qualified ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}>
                    {result.qualified ? "Pass" : "Fail"} / {result.status}
                  </Badge>
                </td>
                <td className="p-3">
                  <Button className="h-8 w-8 px-0" onClick={() => downloadScorecard(result)} title="Download Scorecard"><FileDown size={15} /></Button>
                </td>
              </tr>
            );
          })}
          {!results.length && (
            <tr><td className="p-6 text-center text-slate-500" colSpan={6}>No applications are available for results processing.</td></tr>
          )}
        </tbody>
      </Table>

      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold">Submitted Answers</h2>
          <Badge>{submissions.length} submitted session(s)</Badge>
        </div>
        <Table>
          <thead className="bg-muted">
            <tr>{["Application", "Candidate", "Exam", "Submitted", "Answered", "Status", "Action"].map((h) => <th className="p-3" key={h}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {submissions.map((submission) => {
              const answered = submission.responses.length;
              return (
                <tr className={`border-t border-border ${selectedSubmissionId === submission.id ? "bg-muted/60" : ""}`} key={submission.id}>
                  <td className="p-3 font-semibold">{submission.application?.applicationNo ?? submission.applicationId}</td>
                  <td className="p-3">{displayCandidateName(submission)}</td>
                  <td className="p-3">{submission.application?.examination.code ?? "Unknown"}</td>
                  <td className="p-3">{submission.submittedAt ? new Date(submission.submittedAt).toLocaleString() : "Not available"}</td>
                  <td className="p-3">{answered}</td>
                  <td className="p-3"><Badge>{submission.status}</Badge></td>
                  <td className="p-3"><Button className="h-8 px-3" onClick={() => setSelectedSubmissionId(submission.id)}>View Answers</Button></td>
                </tr>
              );
            })}
            {!submissions.length && <tr><td className="p-6 text-center text-slate-500" colSpan={7}>No submitted answer sheets were found for the selected exam.</td></tr>}
          </tbody>
        </Table>
      </Card>

      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold">Answer Sheet</h2>
          <Badge>{selectedSubmission?.application?.applicationNo ?? "No submission selected"}</Badge>
        </div>
        {!selectedSubmission ? (
          <p className="text-sm text-slate-500">Select a submitted session to inspect the candidate’s answers before evaluation.</p>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-4 text-sm">
              <div className="rounded-md bg-muted p-3"><p className="text-slate-500">Candidate</p><p className="font-semibold">{displayCandidateName(selectedSubmission)}</p></div>
              <div className="rounded-md bg-muted p-3"><p className="text-slate-500">Exam</p><p className="font-semibold">{selectedSubmission.application?.examination.code ?? "Unknown"}</p></div>
              <div className="rounded-md bg-muted p-3"><p className="text-slate-500">Submitted</p><p className="font-semibold">{selectedSubmission.submittedAt ? new Date(selectedSubmission.submittedAt).toLocaleString() : "Not available"}</p></div>
              <div className="rounded-md bg-muted p-3"><p className="text-slate-500">Answered</p><p className="font-semibold">{selectedSubmission.responses.length}</p></div>
            </div>
            <div className="space-y-3">
              {selectedSubmission.responses.map((response, index) => {
                const selectedOption = response.question.options.find((option) => option.id === response.answer?.optionId);
                const correctOption = response.question.options.find((option) => option.isCorrect);
                return (
                  <div className="rounded-md border border-border p-4" key={response.question.id}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold">Q{index + 1}. {response.question.prompt}</p>
                      <Badge className={response.marked ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-700"}>{response.marked ? "Marked for review" : "Saved"}</Badge>
                    </div>
                    <div className="mt-2 grid gap-2 text-sm md:grid-cols-2">
                      <p><strong>Selected:</strong> {selectedOption?.text ?? "No response"}</p>
                      <p><strong>Correct:</strong> {correctOption?.text ?? "Not defined"}</p>
                      <p><strong>Marks:</strong> {response.question.marks}</p>
                      <p><strong>Negative:</strong> {response.question.negativeMarks}</p>
                    </div>
                  </div>
                );
              })}
              {!selectedSubmission.responses.length && <p className="text-sm text-slate-500">This session contains no saved responses.</p>}
            </div>
          </div>
        )}
      </Card>
    </section>
  );
}
