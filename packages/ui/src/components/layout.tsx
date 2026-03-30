import { type ReactNode, useEffect, useMemo, useState } from "react";
import type { Company } from "@agentic-board/shared";
import {
  Activity,
  Bot,
  BriefcaseBusiness,
  FolderKanban,
  LayoutDashboard,
  Menu,
  Moon,
  Sparkles,
  Sun,
  X
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { Button, cn } from "./ui/button";

const navigation = [
  { label: "Dashboard", to: "/", icon: LayoutDashboard },
  { label: "Agents", to: "/agents", icon: Bot },
  { label: "Tasks", to: "/tasks", icon: FolderKanban },
  { label: "Projects", to: "/projects", icon: BriefcaseBusiness },
  { label: "Activity", to: "/activity", icon: Activity }
] as const;

type LayoutProps = {
  children: ReactNode;
  companies: Company[];
  selectedCompany?: Company;
  selectedCompanyId?: string;
  onCompanyChange: (companyId: string) => void;
  isRefreshing?: boolean;
};

function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem("agentic-board-theme");
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem("agentic-board-theme", theme);
  }, [theme]);

  return (
    <button
      onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
      className="theme-toggle"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}

export function Layout({
  children,
  companies,
  selectedCompany,
  selectedCompanyId,
  onCompanyChange,
  isRefreshing
}: LayoutProps) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const location = useLocation();

  const currentSection = useMemo(
    () => navigation.find((item) => item.to === location.pathname)?.label ?? "Dashboard",
    [location.pathname]
  );

  return (
    <div className="min-h-screen px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-[1600px] gap-4">
        <div
          className={cn(
            "panel-strong fixed inset-y-4 left-4 z-40 w-[280px] p-5 transition duration-200 lg:static lg:translate-x-0",
            isMobileNavOpen ? "translate-x-0" : "-translate-x-[120%] lg:translate-x-0"
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-400/30 bg-indigo-500/15 text-indigo-200">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.34em] text-indigo-300">AgenticBoard</p>
                <p className="mt-1 text-lg font-semibold text-white">Mission control</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setIsMobileNavOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <nav className="mt-8 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setIsMobileNavOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "group flex items-center justify-between rounded-2xl px-4 py-3 text-sm transition duration-200",
                      isActive
                        ? "bg-indigo-500/14 text-white shadow-[inset_0_0_0_1px_rgba(129,140,248,0.36)]"
                        : "text-slate-300 hover:bg-white/[0.04] hover:text-white"
                    )
                  }
                >
                  <span className="flex items-center gap-3">
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </span>
                  <span className="h-2 w-2 rounded-full bg-indigo-300/0 transition group-[.active]:bg-indigo-300" />
                </NavLink>
              );
            })}
          </nav>

          <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs uppercase tracking-[0.28em] text-slate-500">About</p>
            <p className="mt-3 text-sm font-medium text-slate-100">
              Open-source AI agent orchestration platform. Manage autonomous agents, tasks, and projects.
            </p>
          </div>
        </div>

        {isMobileNavOpen ? (
          <button
            aria-label="Close navigation"
            className="fixed inset-0 z-30 bg-slate-950/70 backdrop-blur-sm lg:hidden"
            onClick={() => setIsMobileNavOpen(false)}
          />
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col lg:pl-0">
          <header className="panel relative overflow-hidden px-5 py-5 sm:px-6">
            <div className="faint-grid pointer-events-none absolute inset-0 opacity-20" />
            <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="lg:hidden"
                  onClick={() => setIsMobileNavOpen((open) => !open)}
                >
                  <Menu className="h-5 w-5" />
                </Button>
                <div>
                  <p className="text-xs uppercase tracking-[0.32em] text-indigo-300">{currentSection}</p>
                  <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
                    {selectedCompany?.name ?? "Select a company"}
                  </h1>
                  <p className="subtle-text mt-2 max-w-2xl text-sm">
                    {selectedCompany?.description ??
                      "Monitor autonomous work, task flow, and project health across selected workspace."}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <label className="flex min-w-[220px] flex-col gap-2">
                  <span className="text-xs uppercase tracking-[0.24em] text-slate-500">Company context</span>
                  <select
                    className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-indigo-400/40"
                    value={selectedCompanyId ?? ""}
                    onChange={(event) => onCompanyChange(event.target.value)}
                    disabled={!companies.length}
                  >
                    {companies.length ? null : <option value="">No companies available</option>}
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </label>

                <ThemeToggle />
              </div>
            </div>
          </header>

          <main className="flex-1 py-5">{children}</main>
        </div>
      </div>
    </div>
  );
}
