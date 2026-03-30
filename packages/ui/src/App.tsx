import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Company } from "@agentic-board/shared";
import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/layout";
import { api } from "./lib/api";
import { ActivityPage } from "./pages/activity";
import { AgentsPage } from "./pages/agents";
import { DashboardPage } from "./pages/dashboard";
import { ProjectsPage } from "./pages/projects";
import { SettingsPage } from "./pages/settings";
import { SetupPage } from "./pages/setup";
import { TasksPage } from "./pages/tasks";

export function App() {
  const companiesQuery = useQuery({
    queryKey: ["companies"],
    queryFn: api.listCompanies
  });
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | undefined>();

  useEffect(() => {
    const companies = companiesQuery.data;
    if (!companies?.length) {
      return;
    }

    const nextCompany =
      companies.find((company) => company.id === selectedCompanyId) ?? companies[0];

    if (nextCompany && nextCompany.id !== selectedCompanyId) {
      setSelectedCompanyId(nextCompany.id);
    }
  }, [companiesQuery.data, selectedCompanyId]);

  if (companiesQuery.isLoading) {
    return <FullscreenMessage label="?????????????..." />;
  }

  if (companiesQuery.isError) {
    return (
      <FullscreenMessage
        label={companiesQuery.error instanceof Error ? companiesQuery.error.message : "????????????????????"}
      />
    );
  }

  const companies = companiesQuery.data ?? [];
  const selectedCompany = companies.find((company) => company.id === selectedCompanyId);

  if (!companies.length) {
    return <SetupPage onComplete={setSelectedCompanyId} />;
  }

  return (
    <Layout
      companies={companies}
      selectedCompany={selectedCompany}
      selectedCompanyId={selectedCompanyId}
      onCompanyChange={setSelectedCompanyId}
      isRefreshing={companiesQuery.isFetching}
    >
      <Routes>
        <Route path="/" element={<DashboardPage companyId={selectedCompanyId} company={selectedCompany} />} />
        <Route path="/agents" element={<AgentsPage companyId={selectedCompanyId} />} />
        <Route path="/tasks" element={<TasksPage companyId={selectedCompanyId} />} />
        <Route path="/projects" element={<ProjectsPage companyId={selectedCompanyId} />} />
        <Route path="/activity" element={<ActivityPage companyId={selectedCompanyId} />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

function FullscreenMessage({ label }: { label: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="panel-strong max-w-lg px-8 py-10 text-center">
        <p className="text-xs uppercase tracking-[0.32em]" style={{ color: "var(--icon-text)" }}>
          AgenticBoard
        </p>
        <h1 className="mt-4 text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>
          ??????????
        </h1>
        <p className="subtle-text mt-3 text-sm">{label}</p>
      </div>
    </main>
  );
}

export type SharedPageProps = {
  company?: Company | undefined;
  companyId?: string | undefined;
};
