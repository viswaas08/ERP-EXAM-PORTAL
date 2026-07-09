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
  const [theme, setTheme] = usePersistentState("examPortal.settings.theme", "Light and Dark Mode");
  const [passwordPolicy, setPasswordPolicy] = usePersistentState("examPortal.settings.passwordPolicy", "Minimum 8 chars, uppercase, number, symbol");
  const [sessionTimeout, setSessionTimeout] = usePersistentState("examPortal.settings.sessionTimeout", "30 minutes session timeout");
  const [uploadLimit, setUploadLimit] = usePersistentState("examPortal.settings.uploadLimit", "10 MB upload limit");
  const [smtpHost, setSmtpHost] = usePersistentState("examPortal.settings.smtpHost", "smtp.exam.gov");
  const [smtpEmail, setSmtpEmail] = usePersistentState("examPortal.settings.smtpEmail", "notices@exam.gov");
  const [popupNotices, setPopupNotices] = usePersistentState("examPortal.settings.popupNotices", "Enable popup notices");
  const [backupSchedule, setBackupSchedule] = usePersistentState("examPortal.settings.backupSchedule", "Daily 02:00 AM");
  const [backupRetention, setBackupRetention] = usePersistentState("examPortal.settings.backupRetention", "Retain 7 days");

  return (
    <section className="space-y-5">
      <Card className="border-l-4 border-l-primary py-3 text-sm font-medium">{notice}</Card>
      <div><h1 className="text-2xl font-bold">System Settings</h1><p className="text-sm text-slate-500">Organization identity, policy, theme, upload, email, and backup settings.</p></div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-3">
          <h2 className="font-semibold">Portal Identity</h2>
          <Input value={org} onChange={(event) => setOrg(event.target.value)} />
          <Input value={portal} onChange={(event) => setPortal(event.target.value)} />
          <Select value={theme} onChange={(event) => { setTheme(event.target.value); setNotice(`Theme setting changed to ${event.target.value}.`); }}>
            {themeOptions.map((item) => <option key={item} value={item}>{item}</option>)}
          </Select>
        </Card>
        <Card className="space-y-3">
          <h2 className="font-semibold">Security Policy</h2>
          <Input value={passwordPolicy} onChange={(event) => setPasswordPolicy(event.target.value)} />
          <Input value={sessionTimeout} onChange={(event) => setSessionTimeout(event.target.value)} />
          <Input value={uploadLimit} onChange={(event) => setUploadLimit(event.target.value)} />
        </Card>
        <Card className="space-y-3">
          <h2 className="font-semibold">Notifications</h2>
          <Input value={smtpHost} onChange={(event) => setSmtpHost(event.target.value)} />
          <Input value={smtpEmail} onChange={(event) => setSmtpEmail(event.target.value)} />
          <Select value={popupNotices} onChange={(event) => { setPopupNotices(event.target.value); setNotice(`Popup notification policy changed to ${event.target.value}.`); }}>
            {popupOptions.map((item) => <option key={item} value={item}>{item}</option>)}
          </Select>
        </Card>
        <Card className="space-y-3">
          <h2 className="font-semibold">Backup</h2>
          <Input value={backupSchedule} onChange={(event) => setBackupSchedule(event.target.value)} />
          <Select value={backupRetention} onChange={(event) => { setBackupRetention(event.target.value); setNotice(`Backup retention changed to ${event.target.value}.`); }}>
            {retentionOptions.map((item) => <option key={item} value={item}>{item}</option>)}
          </Select>
          <Button onClick={() => setNotice(`${portal} settings saved for ${org}.`)}><Save size={18} /> Save Settings</Button>
        </Card>
      </div>
    </section>
  );
}
