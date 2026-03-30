import { useQuery } from "@tanstack/react-query";
import { Bot, BrainCircuit, Cpu, Wallet } from "lucide-react";
import type { SharedPageProps } from "../App";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { api } from "../lib/api";

export function AgentsPage({ companyId }: SharedPageProps) {
  const agentsQuery = useQuery({
    queryKey: ["agents", companyId],
    queryFn: () => api.getAgents(companyId!),
    enabled: Boolean(companyId)
  });

  if (!companyId) {
    return <ListState message="No company selected." />;
  }

  if (agentsQuery.isLoading) {
    return <ListState message="Loading agents..." />;
  }

  if (agentsQuery.isError) {
    return <ListState message={agentsQuery.error instanceof Error ? agentsQuery.error.message : "Failed to load agents."} />;
  }

  const agents = agentsQuery.data ?? [];

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>Agent directory</CardTitle>
          <CardDescription>Runtime status, capability mix, adapter, and budget utilization for each agent.</CardDescription>
        </CardHeader>
      </Card>

      <section className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        {agents.map((agent) => {
          const budgetRatio =
            agent.budgetMonthlyCents > 0 ? Math.min(agent.spentMonthlyCents / agent.budgetMonthlyCents, 1) : 0;

          return (
            <Card key={agent.id} className="relative overflow-hidden">
              <div className="absolute right-[-18px] top-[-18px] h-24 w-24 rounded-full bg-indigo-500/10 blur-2xl" />
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-2xl border border-indigo-400/20 bg-indigo-500/10 p-3 text-indigo-200">
                      <Bot className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{agent.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {agent.title ?? humanize(agent.role)} · {humanize(agent.adapterType)}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge status={agent.status} />
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-3 sm:grid-cols-3">
                  <Metric icon={BrainCircuit} label="Role" value={humanize(agent.role)} />
                  <Metric icon={Cpu} label="Adapter" value={humanize(agent.adapterType)} />
                  <Metric icon={Wallet} label="Budget" value={formatCurrency(agent.budgetMonthlyCents)} />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-slate-300">Monthly spend</span>
                    <span className="text-slate-400">
                      {formatCurrency(agent.spentMonthlyCents)} / {formatCurrency(agent.budgetMonthlyCents)}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-white/8">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-sky-400"
                      style={{ width: `${budgetRatio * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Capabilities</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {agent.capabilities.length ? (
                      agent.capabilities.map((capability) => (
                        <span
                          key={capability}
                          className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-slate-300"
                        >
                          {capability}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-slate-500">No capabilities listed.</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-slate-400">
                  <span>Heartbeat</span>
                  <span>{agent.lastHeartbeatAt ? formatRelative(agent.lastHeartbeatAt) : "No heartbeat yet"}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      {!agents.length ? <ListState message="No agents returned for this company." /> : null}
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value
}: {
  icon: typeof Bot;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-slate-950/55 p-3">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-500">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <p className="mt-3 text-sm font-medium text-white">{value}</p>
    </div>
  );
}

function ListState({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="flex min-h-[220px] items-center justify-center">
        <p className="text-sm text-slate-400">{message}</p>
      </CardContent>
    </Card>
  );
}

function humanize(value: string) {
  return value.replaceAll("_", " ");
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(cents / 100);
}

function formatRelative(value: string) {
  const delta = Date.now() - new Date(value).getTime();
  const minutes = Math.round(delta / 60_000);
  if (minutes < 1) {
    return "Just now";
  }
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }
  return `${Math.round(hours / 24)}d ago`;
}
