import { Save } from "lucide-react";
import { Button, Card, Input, Select } from "../components/ui";

export function Settings() {
  return (
    <section className="space-y-5">
      <div><h1 className="text-2xl font-bold">System Settings</h1><p className="text-sm text-slate-500">Organization identity, policy, theme, upload, email, and backup settings.</p></div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-3"><h2 className="font-semibold">Portal Identity</h2><Input defaultValue="National Examination Authority" /><Input defaultValue="Centralized Competitive Examination Portal" /><Select><option>Light and Dark Mode</option></Select></Card>
        <Card className="space-y-3"><h2 className="font-semibold">Security Policy</h2><Input defaultValue="Minimum 8 chars, uppercase, number, symbol" /><Input defaultValue="30 minutes session timeout" /><Input defaultValue="10 MB upload limit" /></Card>
        <Card className="space-y-3"><h2 className="font-semibold">Notifications</h2><Input defaultValue="smtp.exam.gov" /><Input defaultValue="notices@exam.gov" /><Select><option>Enable popup notices</option></Select></Card>
        <Card className="space-y-3"><h2 className="font-semibold">Backup</h2><Input defaultValue="Daily 02:00 AM" /><Select><option>Retain 30 days</option></Select><Button><Save size={18} /> Save Settings</Button></Card>
      </div>
    </section>
  );
}
