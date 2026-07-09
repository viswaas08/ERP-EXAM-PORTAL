import { Save } from "lucide-react";
import { useState } from "react";
import { Button, Card, Input, Select } from "../components/ui";
import { usePersistentState } from "../lib/usePersistentState";
const themeOptions = ["Light and Dark Mode", "Light Mode Only", "Dark Mode Only", "Auto System Theme", "High Contrast"];
const popupOptions = ["Enable popup notices", "Disable popup notices", "Only high priority notices", "Banner only", "Dashboard only"];
const retentionOptions = ["Retain 7 days", "Retain 30 days", "Retain 90 days", "Retain 180 days", "Retain 1 year"];

export function Settings() {
  const [notice, setNotice] = usePersistentState("examPortal.settings.notice", "System settings are loaded.");
  const [org, setOrg] = usePersistentState("examPortal.settings.org", "National Examination Authority");
  const [portal, setPortal] = usePersistentState("examPortal.settings.portal", "Centralized Competitive Examination Portal");
  const [passwordPolicy, setPasswordPolicy] = usePersistentState("examPortal.settings.passwordPolicy", "Minimum 8 chars, uppercase, number, symbol");
  const [sessionTimeout, setSessionTimeout] = usePersistentState("examPortal.settings.sessionTimeout", "30 minutes session timeout");
  const [uploadLimit, setUploadLimit] = usePersistentState("examPortal.settings.uploadLimit", "10 MB upload limit");
  const [smtpHost, setSmtpHost] = usePersistentState("examPortal.settings.smtpHost", "smtp.exam.gov");
  const [noticeEmail, setNoticeEmail] = usePersistentState("examPortal.settings.noticeEmail", "notices@exam.gov");
  const [backupTime, setBackupTime] = usePersistentState("examPortal.settings.backupTime", "Daily 02:00 AM");
  const [themeMode, setThemeMode] = usePersistentState("examPortal.settings.themeMode", "Light and Dark Mode");
  const [popupMode, setPopupMode] = usePersistentState("examPortal.settings.popupMode", "Enable popup notices");
  const [retention, setRetention] = usePersistentState("examPortal.settings.retention", "Retain 30 days");

  return (
    <section className="space-y-5">
      <Card className="border-l-4 border-l-primary py-3 text-sm font-medium">{notice}</Card>
      <div><h1 className="text-2xl font-bold">System Settings</h1><p className="text-sm text-slate-500">Organization identity, policy, theme, upload, email, and backup settings.</p></div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-3"><h2 className="font-semibold">Portal Identity</h2><Input value={org} onChange={(event) => setOrg(event.target.value)} /><Input value={portal} onChange={(event) => setPortal(event.target.value)} /><Select value={themeMode} onChange={(event) => { setThemeMode(event.target.value); setNotice(`Theme setting changed to ${event.target.value}.`); }}>{themeOptions.map((item) => <option key={item}>{item}</option>)}</Select></Card>
        <Card className="space-y-3"><h2 className="font-semibold">Security Policy</h2><Input value={passwordPolicy} onChange={(event) => setPasswordPolicy(event.target.value)} /><Input value={sessionTimeout} onChange={(event) => setSessionTimeout(event.target.value)} /><Input value={uploadLimit} onChange={(event) => setUploadLimit(event.target.value)} /></Card>
        <Card className="space-y-3"><h2 className="font-semibold">Notifications</h2><Input value={smtpHost} onChange={(event) => setSmtpHost(event.target.value)} /><Input value={noticeEmail} onChange={(event) => setNoticeEmail(event.target.value)} /><Select value={popupMode} onChange={(event) => setPopupMode(event.target.value)}>{popupOptions.map((item) => <option key={item}>{item}</option>)}</Select></Card>
        <Card className="space-y-3"><h2 className="font-semibold">Backup</h2><Input value={backupTime} onChange={(event) => setBackupTime(event.target.value)} /><Select value={retention} onChange={(event) => setRetention(event.target.value)}>{retentionOptions.map((item) => <option key={item}>{item}</option>)}</Select><Button onClick={() => setNotice(`${portal} settings saved for ${org}.`)}><Save size={18} /> Save Settings</Button></Card>
      </div>
    </section>
  );
}
