import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { Bell, LogOut, Menu, Moon, Search, Shield, UserRound } from "lucide-react";
import { navItems } from "../data/demo";
import { Button } from "./ui";
import { useState } from "react";
import { cn } from "../lib/utils";
import { useAuth } from "../auth/AuthContext";

export function AppShell() {
  const [collapsed, setCollapsed] = useState(false);
  const [dark, setDark] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function toggleTheme() {
    setDark((value) => {
      document.documentElement.classList.toggle("dark", !value);
      return !value;
    });
  }

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="flex min-h-screen">
      <aside className={cn("hidden border-r border-border bg-card transition-all md:block", collapsed ? "w-20" : "w-72")}>
        <Link to="/admin" className="flex h-16 items-center gap-3 border-b border-border px-5">
          <span className="grid h-10 w-10 place-items-center rounded-md bg-primary text-white"><Shield size={20} /></span>
          {!collapsed && <span className="font-bold leading-tight">Central Exam Portal</span>}
        </Link>
        <nav className="space-y-1 p-3">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/admin"}
              className={({ isActive }) =>
                cn("flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium", isActive ? "bg-primary text-white" : "hover:bg-muted")
              }
            >
              <item.icon size={18} />
              {!collapsed && item.title}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="min-w-0 flex-1">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b border-border bg-card/95 px-4 backdrop-blur">
          <Button className="h-9 w-9 px-0" onClick={() => setCollapsed(!collapsed)} title="Toggle sidebar"><Menu size={18} /></Button>
          <div className="relative max-w-lg flex-1">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input className="h-10 w-full rounded-md border border-border bg-background pl-10 pr-3 text-sm outline-none" placeholder="Search candidates, applications, exams" />
          </div>
          <Button className="h-9 w-9 bg-secondary px-0" title="Notifications"><Bell size={18} /></Button>
          <Button className="h-9 w-9 bg-slate-800 px-0" onClick={toggleTheme} title="Theme"><Moon size={18} /></Button>
          <div className="hidden items-center gap-2 rounded-md border border-border px-3 py-2 text-sm lg:flex">
            <UserRound size={16} />
            <span className="max-w-40 truncate">{user?.name ?? "Admin"}</span>
          </div>
          <Button className="h-9 bg-destructive px-3" onClick={handleLogout} title="Logout"><LogOut size={17} /> Logout</Button>
        </header>
        <div className="p-4 md:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
