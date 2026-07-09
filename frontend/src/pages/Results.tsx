import { FileDown, RefreshCw, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge, Button, Card, Table } from "../components/ui";
import { usePersistentState } from "../lib/usePersistentState";
import { API_URL, api } from "../lib/api";

type DbApplication = {
  id: string;
  applicationNo: string;
  status: string;
  candidate: { user: { name: string } };
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
};

export function Results() {
  const [notice, setNotice] = usePersistentState("examPortal.results.notice", "Results are calculated. Ready for publishing.");
  const [dbRows, setDbRows] = useState<DbApplication[]>([]);
  const [results, setResults] = useState<ResultRow[]>([]);

  async function loadResults() {
    try {
      const [applications, resultRows] = await Promise.all([
        api<DbApplication[]>("/applications"),
        api<ResultRow[]>("/results")
      ]);
      setDbRows(applications);
      setResults(resultRows);
      setNotice(`${resultRows.length} result(s) loaded from database.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not load result data.");
    }
  }

  useEffect(() => {
    void loadResults();
  }, []);

  async function recalculate() {
    try {
      const evaluated = await api<{ evaluated: number }>("/results/evaluate", { method: "POST", body: JSON.stringify({}) });
      setNotice(`${evaluated.evaluated} submitted exam(s) evaluated in the database.`);
      await loadResults();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Result evaluation failed.");
    }
  }

  async function publishResults() {
    try {
      const published = await api<{ published: number }>("/results/publish", { method: "POST", body: JSON.stringify({}) });
      setNotice(`${published.published} result(s) published live to candidate portal.`);
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
        <div className="flex gap-2">
          <Button className="bg-secondary" onClick={recalculate}><RefreshCw size={18} /> Evaluate</Button>
          <Button onClick={publishResults}><Trophy size={18} /> Publish Results</Button>
        </div>
      </div>
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
                <td className="p-3">{result.application.candidate.user.name}</td>
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
    </section>
  );
}
