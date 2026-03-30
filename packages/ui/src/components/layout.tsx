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
  SlidersHorizontal,
  Sparkles,
  Sun,
  X
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { Button, cn } from "./ui/button";

const navigation = [
  { label: "ダッシュボード", to: "/", icon: LayoutDashboard },
  { label: "エージェント", to: "/agents", icon: Bot },
  { label: "タスク", to: "/tasks", icon: FolderKanban },
  { label: "プロジェクト", to: "/projects", icon: BriefcaseBusiness },
  { label: "アクティビティ", to: "/activity", icon: Activity },
  { label: "設定", to: "/settings", icon: SlidersHorizontal }
] as const;

type LayoutProps = {
  children: ReactNode;
  companies: Company[];
  selectedCompany?: Company | undefined;
  selectedCompanyId?: string | undefined;
  onCompanyChange: (companyId: string) => void;
  isRefreshing?: boolean;
};

const optionStyle = {
  background: "var(--card-strong-bg)",
  color: "var(--text-primary)"
} as const;

export function ThemeToggle() {
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
      aria-label="テーマ切替"
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
    () => navigation.find((item) => item.to === location.pathname)?.label ?? "ダッシュボード",
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
              <div
                className="flex h-12 w-12 items-center justify-center rounded-2xl border"
                style={{
                  borderColor: "var(--border-weak)",
                  background: "var(--icon-bg)",
                  color: "var(--icon-text)"
                }}
              >
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.34em]" style={{ color: "var(--icon-text)" }}>
                  AgenticBoard
                </p>
                <p className="mt-1 text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                  ミッションコントロール
                </p>
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
                      "group flex items-center justify-between rounded-2xl px-4 py-3 text-sm transition duration-200 hover:bg-[var(--accent-very-soft)] hover:text-[var(--text-primary)]",
                      isActive && "shadow-[inset_0_0_0_1px_var(--border-weak)]"
                    )
                  }
                  style={({ isActive }) => ({
                    background: isActive ? "var(--accent-soft)" : "transparent",
                    color: isActive ? "var(--text-primary)" : "var(--text-secondary)"
                  })}
                >
                  <span className="flex items-center gap-3">
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </span>
                  <span
                    className="h-2 w-2 rounded-full transition"
                    style={{ background: location.pathname === item.to ? "var(--icon-text)" : "transparent" }}
                  />
                </NavLink>
              );
            })}
          </nav>

          <div
            className="mt-10 rounded-2xl border p-4"
            style={{ borderColor: "var(--border-weak)", background: "var(--card-bg)" }}
          >
            <p className="text-xs uppercase tracking-[0.28em]" style={{ color: "var(--text-tertiary)" }}>
              このツールについて
            </p>
            <p className="mt-3 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              オープンソースのAIエージェント管理プラットフォーム。エージェント、タスク、プロジェクトを一元管理。
            </p>
          </div>
        </div>

        {isMobileNavOpen ? (
          <button
            aria-label="ナビゲーションを閉じる"
            className="fixed inset-0 z-30 backdrop-blur-sm lg:hidden"
            style={{ background: "var(--card-strong-bg)" }}
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
                  <p className="text-xs uppercase tracking-[0.32em]" style={{ color: "var(--icon-text)" }}>
                    {currentSection}
                    {isRefreshing ? " · 更新中" : ""}
                  </p>
                  <h1 className="mt-2 text-2xl font-semibold sm:text-3xl" style={{ color: "var(--text-primary)" }}>
                    {selectedCompany?.name ?? "ワークスペースを選択"}
                  </h1>
                  <p className="subtle-text mt-2 max-w-2xl text-sm">
                    {selectedCompany?.description ?? "エージェントの自律作業、タスクフロー、プロジェクトの健全性を監視"}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <label className="flex min-w-[220px] flex-col gap-2">
                  <span className="text-xs uppercase tracking-[0.24em]" style={{ color: "var(--text-tertiary)" }}>
                    ワークスペース
                  </span>
                  <select
                    className="rounded-2xl border px-4 py-3 text-sm outline-none transition focus:border-indigo-400/40"
                    style={{
                      borderColor: "var(--border-weak)",
                      background: "var(--card-strong-bg)",
                      color: "var(--text-primary)"
                    }}
                    value={selectedCompanyId ?? ""}
                    onChange={(event) => onCompanyChange(event.target.value)}
                    disabled={!companies.length}
                  >
                    {companies.length ? null : (
                      <option value="" style={optionStyle}>
                        ワークスペースがありません
                      </option>
                    )}
                    {companies.map((company) => (
                      <option key={company.id} value={company.id} style={optionStyle}>
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
