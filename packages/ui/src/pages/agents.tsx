import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bot, BrainCircuit, Cpu, Plus, Wallet, X } from "lucide-react";
import type { SharedPageProps } from "../App";
import {
  AgentEditorFields,
  buildAgentPayload,
  createDefaultAgentDraft,
  type AgentDraft
} from "../components/agent-form";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { api } from "../lib/api";

export function AgentsPage({ companyId }: SharedPageProps) {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [draft, setDraft] = useState<AgentDraft>(() => createDefaultAgentDraft());
  const [createError, setCreateError] = useState<string | null>(null);

  const agentsQuery = useQuery({
    queryKey: ["agents", companyId],
    queryFn: () => api.getAgents(companyId!),
    enabled: Boolean(companyId)
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!companyId) {
        throw new Error("No company selected.");
      }

      return api.createAgent(companyId, buildAgentPayload(draft));
    },
    onSuccess: async () => {
      setDraft(createDefaultAgentDraft());
      setCreateError(null);
      setIsCreateOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["agents", companyId] });
    },
    onError: (error) => {
      setCreateError(error instanceof Error ? error.message : "Failed to create agent.");
    }
  });

  if (!companyId) {
    return <ListState message="No company selected." />;
  }

  if (agentsQuery.isLoading) {
    return <ListState message="Loading agents..." />;
  }

  if (agentsQuery.isError) {
    return (
      <ListState
        message={agentsQuery.error instanceof Error ? agentsQuery.error.message : "Failed to load agents."}
      />
    );
  }

  const agents = agentsQuery.data ?? [];

  const handleCreateAgent = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreateError(null);

    if (!draft.name.trim()) {
      setCreateError("Agent name is required.");
      return;
    }

    await createMutation.mutateAsync();
  };

  return (
    <>
      <div className="space-y-5">
        <Card>
          <CardHeader className="gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <CardTitle>Agent directory</CardTitle>
              <CardDescription className="mt-2">
                Runtime status, capability mix, adapter, budget utilization, and adapter configuration.
              </CardDescription>
            </div>
            <Button
              onClick={() => {
                setCreateError(null);
                setDraft(createDefaultAgentDraft());
                setIsCreateOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Create Agent
            </Button>
          </CardHeader>
        </Card>

        <section className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
          {agents.map((agent) => {
            const budgetRatio =
              agent.budgetMonthlyCents > 0 ? Math.min(agent.spentMonthlyCents / agent.budgetMonthlyCents, 1) : 0;

            return (
              <Card key={agent.id} className="relative overflow-hidden">
                <div
                  className="absolute right-[-18px] top-[-18px] h-24 w-24 rounded-full blur-2xl"
                  style={{ background: "var(--accent-soft)" }}
                />
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div
                        className="rounded-2xl border p-3"
                        style={{
                          borderColor: "var(--border-weak)",
                          background: "var(--icon-bg)",
                          color: "var(--icon-text)"
                        }}
                      >
                        <Bot className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{agent.name}</CardTitle>
                        <CardDescription className="mt-1">
                          {agent.title ?? humanize(agent.role)} - {humanize(agent.adapterType)}
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
                      <span style={{ color: "var(--text-secondary)" }}>Monthly spend</span>
                      <span style={{ color: "var(--text-tertiary)" }}>
                        {formatCurrency(agent.spentMonthlyCents)} / {formatCurrency(agent.budgetMonthlyCents)}
                      </span>
                    </div>
                    <div className="h-2 rounded-full" style={{ background: "var(--surface-soft)" }}>
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-sky-400"
                        style={{ width: `${budgetRatio * 100}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-[0.24em]" style={{ color: "var(--text-tertiary)" }}>
                      Adapter config
                    </p>
                    <div
                      className="mt-3 rounded-2xl border px-4 py-3 text-sm"
                      style={{
                        borderColor: "var(--border-weak)",
                        background: "var(--card-bg)",
                        color: "var(--text-secondary)"
                      }}
                    >
                      {describeAdapterConfig(agent.adapterConfig)}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-[0.24em]" style={{ color: "var(--text-tertiary)" }}>
                      Capabilities
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {agent.capabilities.length ? (
                        agent.capabilities.map((capability) => (
                          <span
                            key={capability}
                            className="rounded-full border px-3 py-1 text-xs"
                            style={{
                              borderColor: "var(--border-weak)",
                              background: "var(--surface-soft)",
                              color: "var(--text-secondary)"
                            }}
                          >
                            {capability}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                          No capabilities listed.
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm" style={{ color: "var(--text-secondary)" }}>
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

      {isCreateOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          style={{ background: "color-mix(in srgb, var(--card-strong-bg) 72%, transparent)" }}
        >
          <div className="panel-strong max-h-[90vh] w-full max-w-3xl overflow-y-auto p-6 sm:p-8">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.28em]" style={{ color: "var(--icon-text)" }}>
                  Agent provisioning
                </p>
                <h2 className="mt-3 text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>
                  Create Agent
                </h2>
                <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                  Name the agent, pick the runtime adapter, and define the adapter configuration upfront.
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsCreateOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <form className="space-y-6" onSubmit={handleCreateAgent}>
              <AgentEditorFields draft={draft} onChange={setDraft} idPrefix="create-agent" />

              {createError ? (
                <p className="text-sm" style={{ color: "var(--danger)" }}>
                  {createError}
                </p>
              ) : null}

              <div className="flex flex-wrap justify-end gap-3">
                <Button variant="ghost" onClick={() => setIsCreateOpen(false)} disabled={createMutation.isPending}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Creating..." : "Create Agent"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
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
    <div
      className="rounded-2xl border p-3"
      style={{ borderColor: "var(--border-weak)", background: "var(--card-bg)" }}
    >
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em]" style={{ color: "var(--text-tertiary)" }}>
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <p className="mt-3 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
        {value}
      </p>
    </div>
  );
}

function ListState({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="flex min-h-[220px] items-center justify-center">
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {message}
        </p>
      </CardContent>
    </Card>
  );
}

function describeAdapterConfig(config: Record<string, unknown> | null) {
  if (!config) {
    return "No adapter configuration saved.";
  }

  if (typeof config.model === "string" && typeof config.permissionMode === "string") {
    return `Model: ${config.model} / Permission: ${humanize(config.permissionMode)}`;
  }

  if (typeof config.model === "string" && typeof config.approval === "string") {
    return `Model: ${config.model} / Approval: ${humanize(config.approval)}`;
  }

  if (typeof config.command === "string") {
    const shell = config.shell === true ? "system default" : typeof config.shell === "string" ? config.shell : "system default";
    return `Command: ${config.command} / Shell: ${shell}`;
  }

  return "Custom adapter configuration";
}

function humanize(value: string) {
  return value.replaceAll(/([a-z])([A-Z])/g, "$1 $2").replaceAll("_", " ");
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
