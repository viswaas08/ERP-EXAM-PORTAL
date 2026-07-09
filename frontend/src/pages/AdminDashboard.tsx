import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useEffect, useState } from "react";
import { registrationTrend, stats } from "../data/demo";
import { Card } from "../components/ui";
import { formatNumber } from "../lib/utils";
import { api } from "../lib/api";

const colors = ["#059669", "#f59e0b", "#dc2626"];

type DashboardSummary = {
  examinations: number;
  candidates: number;
  applications: number;
  approved: number;
  pending: number;
  rejected: number;
  hallTickets: number;
  results: number;
};

export function AdminDashboard() {
  const [summary, setSummary] = useState<DashboardSummary>({
    examinations: 0,
    candidates: 0,
    applications: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
    hallTickets: 0,
    results: 0
  });
  const [notice, setNotice] = useState("Dashboard summary loads from the database.");

  useEffect(() => {
    api<DashboardSummary>("/dashboard/summary")
      .then((data) => {
        setSummary(data);
        setNotice("Live database summary loaded.");
      })
      .catch((error) => setNotice(error instanceof Error ? error.message : "Could not load dashboard summary."));
  }, []);

  const statValues = [summary.examinations, summary.candidates, summary.applications, summary.approved, summary.pending, summary.rejected, summary.hallTickets, summary.results];
  const liveStats = stats.map((stat, index) => ({ ...stat, value: statValues[index] ?? 0 }));
  const statusData = [
    { name: "Approved", value: summary.approved },
    { name: "Pending", value: summary.pending },
    { name: "Rejected", value: summary.rejected }
  ];

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-sm text-slate-500">{notice}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {liveStats.map((stat) => (
          <Card key={stat.label}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">{stat.label}</p>
                <p className="mt-2 text-2xl font-bold">{formatNumber(stat.value)}</p>
              </div>
              <stat.icon className={stat.tone} size={28} />
            </div>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <Card>
          <h2 className="mb-4 font-semibold">Daily Registrations</h2>
          <div className="h-72">
            <ResponsiveContainer>
              <AreaChart data={registrationTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="registrations" stroke="#1d4ed8" fill="#bfdbfe" />
                <Area type="monotone" dataKey="approved" stroke="#0f766e" fill="#99f6e4" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <h2 className="mb-4 font-semibold">Applications by Status</h2>
          <div className="h-72">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" outerRadius={95} label>
                  {statusData.map((entry, index) => <Cell key={entry.name} fill={colors[index]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
      <Card>
        <h2 className="mb-4 font-semibold">Attendance and Pass Percentage</h2>
        <div className="h-72">
          <ResponsiveContainer>
            <BarChart data={registrationTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="registrations" fill="#1d4ed8" name="Attendance" />
              <Bar dataKey="approved" fill="#f59e0b" name="Pass Percentage" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </section>
  );
}
