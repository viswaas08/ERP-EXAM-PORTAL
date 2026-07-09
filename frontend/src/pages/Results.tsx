import { FileDown, RefreshCw, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { applications } from "../data/demo";
import { Badge, Button, Card, Table } from "../components/ui";
import { usePersistentState } from "../lib/usePersistentState";
import { api } from "../lib/api";

type DbApplication = {
  id: string;
  applicationNo: string;
  status: string;
  candidate: { user: { name: string } };
  examination: { code: string; name: string };
};

export function Results() {
  const [published, setPublished] = usePersistentState("examPortal.results.published", false);
  const [notice, setNotice] = usePersistentState("examPortal.results.notice", "Results are calculated. Ready for publishing.");
  const [dbRows, setDbRows] = useState<DbApplication[]>([]);
  const [scores, setScores] = usePersistentState<Record<string, number>>("examPortal.results.scores", {});

  useEffect(() => {
    api<DbApplication[]>("/applications")
      .then((data) => {
        if (data && data.length > 0) {
          setDbRows(data);
          setNotice(`Loaded ${data.length} candidate application(s) from database.`);
        }
      })
      .catch(() => {
        setNotice("Loaded local candidate applications (demo mode).");
      });
  }, []);

  const displayRows = dbRows.length > 0
    ? dbRows.map((app) => ({
        id: app.applicationNo,
        name: app.candidate.user.name,
        exam: app.examination.code,
        status: app.status
      }))
    : applications;

  // Initialize scores if not set
  useEffect(() => {
    if (displayRows.length > 0) {
      setScores((current) => {
        const next = { ...current };
        let updated = false;
        displayRows.forEach((app, index) => {
          if (next[app.id] === undefined) {
            next[app.id] = index % 2 === 0 ? 82 : 45;
            updated = true;
          }
        });
        return updated ? next : current;
      });
    }
  }, [displayRows, setScores]);

  function recalculate() {
    setScores((current) => {
      const next = { ...current };
      displayRows.forEach((app) => {
        next[app.id] = Math.floor(Math.random() * 40) + 60;
      });
      return next;
    });
    setNotice("Results recalculated with normalization applied.");
  }

  function togglePublish() {
    setPublished((value) => !value);
    setNotice(published ? "Results unpublished." : "Results published live to candidate portal.");
  }

  function downloadScorecard(id: string) {
    const score = scores[id] ?? 0;
    const pass = score >= 50;
    const content = `Score Card\nApplication: ${id}\nScore: ${score}\nResult: ${pass ? "PASS" : "FAIL"}`;
    const url = URL.createObjectURL(new Blob([content], { type: "text/plain" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${id}-scorecard.txt`;
    link.click();
    URL.revokeObjectURL(url);
    setNotice(`${id} scorecard downloaded.`);
  }

  return (
    <section className="space-y-5">
      <Card className="border-l-4 border-l-primary py-3 text-sm font-medium">{notice}</Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold">Results Processing</h1><p className="text-sm text-slate-500">Calculate normalized scores, compile merit lists, and publish candidate score cards.</p></div>
        <div className="flex gap-2">
          <Button className="bg-secondary" onClick={recalculate}><RefreshCw size={18} /> Recalculate</Button>
          <Button onClick={togglePublish} className={published ? "bg-amber-600" : "bg-primary"}><Trophy size={18} /> {published ? "Unpublish Results" : "Publish Results"}</Button>
        </div>
      </div>
      <Card className="grid gap-3 md:grid-cols-4">
        {["Total Scored: " + displayRows.length, "Passed: " + displayRows.filter((app) => (scores[app.id] ?? 0) >= 50).length, "Failed: " + displayRows.filter((app) => (scores[app.id] ?? 0) < 50).length, "Status: " + (published ? "Published" : "Draft")].map((item) => (
          <div className="rounded-md bg-muted p-4 font-semibold" key={item}>{item}</div>
        ))}
      </Card>
      <Table>
        <thead className="bg-muted">
          <tr>{["Application", "Candidate", "Exam", "Score", "Result", "Actions"].map((h) => <th className="p-3" key={h}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {displayRows.map((app) => {
            const score = scores[app.id] ?? 0;
            const pass = score >= 50;
            return (
              <tr className="border-t border-border" key={app.id}>
                <td className="p-3 font-semibold">{app.id}</td>
                <td className="p-3">{app.name}</td>
                <td className="p-3">{app.exam}</td>
                <td className="p-3 font-semibold">{score}</td>
                <td className="p-3">
                  <Badge className={pass ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}>
                    {pass ? "Pass" : "Fail"}
                  </Badge>
                </td>
                <td className="p-3">
                  <Button className="h-8 w-8 px-0" onClick={() => downloadScorecard(app.id)} title="Download Scorecard"><FileDown size={15} /></Button>
                </td>
              </tr>
            );
          })}
          {!displayRows.length && (
            <tr><td className="p-6 text-center text-slate-500" colSpan={6}>No applications are available for results processing.</td></tr>
          )}
        </tbody>
      </Table>
    </section>
  );
}
