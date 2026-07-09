import { useState } from "react";
import { ArrowRight, BarChart3, Building2, Eye, EyeOff, FileCheck2, GraduationCap, ShieldCheck, TicketCheck, UsersRound } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button, Card, Input } from "../components/ui";
import { useAuth } from "../auth/AuthContext";

export function Login() {
  const [email, setEmail] = useState("admin@exam.gov");
  const [password, setPassword] = useState("Password@123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const destination = typeof location.state === "object" && location.state && "from" in location.state ? String(location.state.from) : "/admin";

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
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
              <h2 className="mt-2 text-2xl font-bold">Sign in to continue</h2>
              <p className="mt-2 text-sm text-slate-500">Use staff credentials for the admin portal or candidate credentials for the candidate dashboard.</p>
            </div>
            <form className="space-y-3" onSubmit={handleSubmit}>
              <Input placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} />
              <div className="relative">
                <Input className="pr-11" placeholder="Password" type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} />
                <button className="absolute inset-y-0 right-0 grid w-11 place-items-center text-slate-500" type="button" onClick={() => setShowPassword((value) => !value)} title={showPassword ? "Hide password" : "Show password"}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
              <Button className="w-full" disabled={loading}>{loading ? "Signing in..." : "Login"} <ArrowRight size={18} /></Button>
            </form>
            <div className="mt-5 grid gap-2 text-sm">
              <button className="rounded-md border border-border p-2 text-left hover:bg-muted" onClick={() => { setEmail("admin@exam.gov"); setPassword("Password@123"); }}>Use seeded Super Admin</button>
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
