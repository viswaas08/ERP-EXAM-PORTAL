import { useState } from "react";
import { ArrowRight, BarChart3, Building2, Eye, EyeOff, FileCheck2, GraduationCap, ShieldCheck, TicketCheck, UsersRound } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button, Card, Input } from "../components/ui";
import { useAuth } from "../auth/AuthContext";
import { api } from "../lib/api";

function PasswordInput({
  label,
  value,
  onChange,
  visible,
  onToggle,
  helper
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  onToggle: () => void;
  helper?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</span>
      <div className="flex h-11 items-center rounded-md border border-border bg-white focus-within:ring-2 focus-within:ring-primary/25 dark:bg-slate-900">
        <input
          className="h-full min-w-0 flex-1 rounded-md bg-transparent px-3 text-sm outline-none"
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        <button className="grid h-10 w-10 shrink-0 place-items-center rounded-md text-slate-500 hover:bg-muted" type="button" onClick={onToggle} title={visible ? "Hide password" : "Show password"}>
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {helper && <span className="mt-1.5 block text-xs text-slate-500">{helper}</span>}
    </label>
  );
}

export function Login() {
  const [email, setEmail] = useState("admin@exam.gov");
  const [password, setPassword] = useState("Password@123");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const destination = typeof location.state === "object" && location.state && "from" in location.state ? String(location.state.from) : "/admin";

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);
    try {
      if (resetMode) {
        if (password.length < 8) throw new Error("New password must be at least 8 characters.");
        if (password !== confirmPassword) throw new Error("New password and confirm password do not match.");
        await api<{ message: string }>("/auth/reset-password", {
          method: "POST",
          body: JSON.stringify({ email, password })
        });
        setNotice("Password reset successfully. You can login with the new password.");
        setResetMode(false);
        setConfirmPassword("");
        return;
      }
      const user = await login(email, password);
      navigate(user.role === "Candidate" ? "/candidate" : destination, { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message.includes("Invalid credentials") ? "The email and password do not match. Use the password entered during registration." : message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="grid min-h-screen lg:grid-cols-[1.15fr_0.85fr]">
        <section className="relative overflow-hidden bg-[linear-gradient(135deg,#0f3c68_0%,#0f766e_54%,#f59e0b_100%)] px-6 py-8 text-white md:px-12">
          <div className="relative z-10 flex h-full flex-col justify-between">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-md bg-white/15 backdrop-blur"><ShieldCheck /></span>
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-white/75">National Examination Authority</p>
                <h1 className="text-xl font-bold">Central Exam Portal</h1>
              </div>
            </div>
            <div className="max-w-3xl py-12">
              <p className="mb-4 inline-flex rounded-full border border-white/25 px-3 py-1 text-sm text-white/85">Enterprise examination command center</p>
              <h2 className="text-4xl font-bold leading-tight md:text-6xl">One secure portal for registration, scrutiny, CBT exams, and results.</h2>
              <p className="mt-5 max-w-2xl text-lg text-white/82">Configure examinations, dynamic forms, eligibility rules, centre allocation, hall tickets, question banks, online tests, and score cards without touching code.</p>
              <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  { label: "Candidate self-service", icon: UsersRound },
                  { label: "Configurable exams", icon: GraduationCap },
                  { label: "Verified tickets", icon: TicketCheck },
                  { label: "Live analytics", icon: BarChart3 }
                ].map((item) => (
                  <div className="rounded-lg border border-white/20 bg-white/10 p-4 backdrop-blur" key={item.label}>
                    <item.icon className="mb-3" size={24} />
                    <p className="font-semibold">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid gap-3 text-sm text-white/85 md:grid-cols-3">
              <span className="flex items-center gap-2"><Building2 size={17} /> Multi-department ready</span>
              <span className="flex items-center gap-2"><FileCheck2 size={17} /> Rule-based verification</span>
              <span className="flex items-center gap-2"><ShieldCheck size={17} /> JWT and RBAC secured</span>
            </div>
          </div>
        </section>

        <section className="grid place-items-center p-5 md:p-10">
          <Card className="w-full max-w-md">
            <div className="mb-6">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Secure access</p>
              <h2 className="mt-2 text-2xl font-bold">{resetMode ? "Reset password" : "Sign in to continue"}</h2>
              <p className="mt-2 text-sm text-slate-500">{resetMode ? "Enter the account email and a new password. The database password will be updated immediately." : "Use staff credentials for the admin portal or candidate credentials for the candidate dashboard."}</p>
            </div>
            <form className="space-y-3" onSubmit={handleSubmit}>
              <Input placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} />
              <PasswordInput label={resetMode ? "New password" : "Password"} value={password} onChange={setPassword} visible={showPassword} onToggle={() => setShowPassword((value) => !value)} helper={resetMode ? "Use at least 8 characters." : undefined} />
              {resetMode && <PasswordInput label="Confirm new password" value={confirmPassword} onChange={setConfirmPassword} visible={showPassword} onToggle={() => setShowPassword((value) => !value)} />}
              {error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
              {notice && <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</div>}
              <Button className="w-full" disabled={loading}>{loading ? (resetMode ? "Resetting..." : "Signing in...") : (resetMode ? "Reset Password" : "Login")} <ArrowRight size={18} /></Button>
            </form>
            <div className="mt-5 grid gap-2 text-sm">
              <button className="rounded-md border border-border p-2 text-left hover:bg-muted" onClick={() => { setEmail("admin@exam.gov"); setPassword("Password@123"); }}>Use seeded Super Admin</button>
              <button className="rounded-md border border-border p-2 text-left hover:bg-muted" onClick={() => { setResetMode((value) => !value); setError(""); setNotice(""); setConfirmPassword(""); }}>{resetMode ? "Back to login" : "Reset password"}</button>
              <p className="rounded-md bg-muted p-2 text-slate-600">Candidates must register first, then login with their own email and password.</p>
            </div>
            <div className="mt-5 flex flex-wrap justify-between gap-2 text-sm font-semibold text-primary">
              <Link to="/register">New candidate registration</Link>
              <Link to="/candidate">View candidate dashboard</Link>
            </div>
          </Card>
        </section>
      </div>
    </main>
  );
}
