import { Card, Table } from "../components/ui";

export function AuditLogs() {
  const rows = ["Created examination", "Approved application", "Updated eligibility rule", "Generated hall ticket", "Published notice", "Downloaded merit list"];
  return (
    <section className="space-y-5">
      <div><h1 className="text-2xl font-bold">Audit Logs</h1><p className="text-sm text-slate-500">Every role-based action with before and after values.</p></div>
      <Card>
        <Table><thead className="bg-muted"><tr>{["User", "Role", "Action", "Record", "Timestamp", "IP Address"].map((h) => <th className="p-3" key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((action, i) => <tr className="border-t border-border" key={action}><td className="p-3">staff{i + 1}@exam.gov</td><td className="p-3">{["Super Admin", "Verifier", "Controller", "Result Officer"][i % 4]}</td><td className="p-3">{action}</td><td className="p-3">REC-{1000 + i}</td><td className="p-3">09 Jul 2026, 18:{20 + i}</td><td className="p-3">10.0.0.{i + 12}</td></tr>)}</tbody></Table>
      </Card>
    </section>
  );
}
