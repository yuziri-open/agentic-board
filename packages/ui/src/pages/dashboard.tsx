import { useQuery } from "@tanstack/react-query";
import type { Agent } from "@agentic-board/shared";
import { ArrowUpRight, Bot, BriefcaseBusiness, CircleCheckBig, FolderKanban, TimerReset } from "lucide-react";
import type { SharedPageProps } from "../App";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardStat, CardTitle } from "../components/ui/card";
import { api, kanbanStatuses } from "../lib/api";

export function DashboardPage({ company, companyId }: SharedPageProps) {
  const dashboardQuery = useQuery({
    queryKey: ["dashboard", companyId],
    queryFn: () => api.getDashboard(companyId!),
    enabled: Boolean(companyId)
  });

  if (!companyId) {
    return <EmptyState message="No company was returned by the API yet. Create one to populate the dashboard." />;
  }

  if (dashboardQuery.isLoading) {
    return <EmptyState message="Loading dashboard summary..." />;
  }

  if (dashboardQuery.isError) {
    return (
      <EmptyState
        message={dashboardQuery.error instanceof Error ? dashboardQuery.error.message : "Failed to load dashboard."}
      />
    );
  }

  const data = dashboardQuery.data;
  if (!data) {
    return <EmptyState message="Dashboard payload was empty." />;
  }

  const summaryCards = [
    {
      eyebrow: "Tasks total",
      value: String(data.summary.tasksTotal),
      trend: `${data.tasksByStatus.backlog.length} backlog · ${data.tasksByStatus.todo.length} ready`,
      icon: FolderKanban
    },
    {
      eyebrow: "Agents online",
      value: `${data.summary.agentsOnline}/${data.summary.agentsTotal}`,
      trend: `${data.agents.filter((agent) => agent.status === "running").length} executing now`,
      icon: Bot
    },
    {
      eyebrow: "In review",
      value: String(data.summary.tasksInReview),
      trend: `${data.summary.tasksDoneToday} tasks closed today`,
      icon: CircleCheckBig
    },
    {
      eyebrow: "Monthly spend",
      value: formatCurrency(data.summary.monthlyCostCents),
      trend: `${data.projects.length} active project surfaces`,
      icon: BriefcaseBusiness
    }
  ];

  return (
    <div className="space-y-5">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.eyebrow} className="relative overflow-hidden">
              <div className="absolute right-4 top-4 rounded-2xl border border-indigo-400/20 bg-indigo-500/10 p-3 text-indigo-200">
                <Icon className="h-5 w-5" />
              </div>
              <CardHeader>
                <CardStat eyebrow={item.eyebrow} value={item.value} trend={item.trend} />
              </CardHeader>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.95fr)]">
        <Card className="relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/40 to-transparent" />
          <CardHeader className="flex flex-row items-end justify-between gap-4">
            <div>
              <CardTitle>Kanban preview</CardTitle>
              <CardDescription>Fast view of the current workstream across the five active statuses.</CardDescription>
            </div>
            <Badge status="in_progress">{data.summary.tasksInProgress} in progress</Badge>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              {kanbanStatuses.map((status) => {
                const tasks = data.tasksByStatus[status];
                return (
                  <div key={status} className="rounded-3xl border border-white/8 bg-slate-950/50 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium capitalize text-white">{status.replaceAll("_", " ")}</p>
                      <Badge status={status}>{tasks.length}</Badge>
                    </div>
                    <div className="mt-4 space-y-3">
                      {tasks.slice(0, 3).map((task) => (
                        <div key={task.id} className="rounded-2xl border border-white/6 bg-white/[0.03] p-3">
                          <p className="text-sm font-medium text-slate-100">{task.title}</p>
                          <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-500">
                            {task.identifier ?? "Unnumbered"}
                          </p>
                        </div>
                      ))}
                      {!tasks.length ? <p className="text-sm text-slate-500">No tasks in this lane.</p> : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute right-[-10%] top-[-10%] h-36 w-36 rounded-full bg-indigo-500/15 blur-3xl" />
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <CardDescription>Latest mutations affecting the selected company.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.recentActivity.slice(0, 7).map((entry) => (
              <div key={entry.id} className="flex gap-3 rounded-2xl border border-white/8 bg-slate-950/55 p-4">
                <div className="mt-1 rounded-full border border-indigo-400/30 bg-indigo-500/10 p-2 text-indigo-200">
                  <TimerReset className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-100">{humanize(entry.action)}</p>
                  <p className="mt-1 text-sm text-slate-400">{formatDetails(entry.details)}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-500">{formatDate(entry.createdAt)}</p>
                </div>
              </div>
            ))}
            {!data.recentActivity.length ? <p className="text-sm text-slate-500">No recent activity recorded.</p> : null}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-end justify-between gap-4">
            <div>
              <CardTitle>Agent roster</CardTitle>
              <CardDescription>Who is active, paused, or waiting for work.</CardDescription>
            </div>
            <Badge status="running">{data.agents.filter(isAgentOnline).length} online</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.agents.slice(0, 5).map((agent) => (
              <div key={agent.id} className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                <div>
                  <p className="font-medium text-white">{agent.name}</p>
                  <p className="mt-1 text-sm text-slate-400">{agent.title ?? humanize(agent.role)}</p>
                </div>
                <div className="text-right">
                  <Badge status={agent.status} />
                  <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-500">
                    {agent.adapterType.replaceAll("_", " ")}
                  </p>
                </div>
              </div>
            ))}
            {!data.agents.length ? <p className="text-sm text-slate-500">No agents available.</p> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-end justify-between gap-4">
            <div>
              <CardTitle>Project surfaces</CardTitle>
              <CardDescription>Recently updated workspaces linked to the selected company.</CardDescription>
            </div>
            <ArrowUpRight className="h-5 w-5 text-indigo-200" />
          </CardHeader>
          <CardContent className="space-y-3">
            {data.projects.slice(0, 5).map((project) => (
              <div key={project.id} className="rounded-2xl border border-white/8 bg-slate-950/55 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-white">{project.name}</p>
                    <p className="mt-1 text-sm text-slate-400">{project.description ?? "No description provided."}</p>
                  </div>
                  <Badge status={project.status} />
                </div>
                <p className="mt-3 text-xs uppercase tracking-[0.2em] text-slate-500">
                  {project.workspacePath ?? "Workspace path not set"}
                </p>
              </div>
            ))}
            {!data.projects.length ? <p className="text-sm text-slate-500">No projects registered.</p> : null}
          </CardContent>
        </Card>
      </section>

      <section className="rounded-[2rem] border border-indigo-400/20 bg-indigo-500/8 p-5">
        <p className="text-xs uppercase tracking-[0.32em] text-indigo-200">Company snapshot</p>
        <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">{company?.name ?? data.company.name}</h2>
            <p className="mt-2 max-w-3xl text-sm text-indigo-100/75">
              {company?.description ?? data.company.description ?? "No description has been set for this company yet."}
            </p>
          </div>
          <p className="text-sm text-indigo-100/80">Cancelled tasks tracked separately: {data.tasksByStatus.cancelled.length}</p>
        </div>
      </section>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <Card className="min-h-[260px]">
      <CardContent className="flex min-h-[260px] items-center justify-center">
        <p className="text-sm text-slate-400">{message}</p>
      </CardContent>
    </Card>
  );
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(cents / 100);
}

function humanize(value: string) {
  return value.replaceAll(".", " ").replaceAll("_", " ");
}

function formatDetails(details: Record<string, unknown> | null) {
  if (!details) {
    return "No metadata attached.";
  }

  return Object.entries(details)
    .slice(0, 3)
    .map(([key, value]) => `${humanize(key)}: ${String(value)}`)
    .join(" · ");
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function isAgentOnline(agent: Agent) {
  if (agent.status === "running") {
    return true;
  }

  return agent.lastHeartbeatAt ? Date.now() - new Date(agent.lastHeartbeatAt).getTime() <= 10 * 60_000 : false;
}
