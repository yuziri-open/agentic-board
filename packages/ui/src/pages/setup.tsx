import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Bot, Building2, CheckCircle2, Sparkles, TerminalSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  AgentEditorFields,
  buildAgentPayload,
  createDefaultAgentDraft,
  getAdapterSummary,
  type AgentDraft
} from "../components/agent-form";
import { ThemeToggle } from "../components/layout";
import { Button } from "../components/ui/button";
import { api } from "../lib/api";

type SetupPageProps = {
  onComplete: (companyId: string) => void;
};

type DiagnosisState =
  | { status: "idle" }
  | { status: "running" }
  | { status: "done"; ok: boolean; message: string };

export function SetupPage({ onComplete }: SetupPageProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [companyName, setCompanyName] = useState("");
  const [companyDescription, setCompanyDescription] = useState("");
  const [agentDraft, setAgentDraft] = useState<AgentDraft>(() => createDefaultAgentDraft());
  const [diagnosis, setDiagnosis] = useState<DiagnosisState>({ status: "idle" });
  const [createdCompanyId, setCreatedCompanyId] = useState<string | null>(null);
  const [createdAgent, setCreatedAgent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setDiagnosis({ status: "idle" });
  }, [agentDraft.adapterType]);

  const steps = useMemo(
    () => [
      { number: 1, title: "Company", icon: Building2 },
      { number: 2, title: "Agent", icon: Bot },
      { number: 3, title: "Diagnosis", icon: TerminalSquare }
    ],
    []
  );

  const canProceed = step === 1 ? companyName.trim().length > 0 : agentDraft.name.trim().length > 0;

  const handleNext = () => {
    if (!canProceed) {
      setError(step === 1 ? "Company name is required." : "Agent name is required.");
      return;
    }

    setError(null);
    setStep((current) => Math.min(current + 1, 3));
  };

  const handleRunDiagnosis = async () => {
    setError(null);
    setDiagnosis({ status: "running" });

    try {
      const result = await api.diagnoseAdapter(agentDraft.adapterType);
      setDiagnosis({ status: "done", ...result });
    } catch (diagnoseError) {
      setDiagnosis({
        status: "done",
        ok: false,
        message: diagnoseError instanceof Error ? diagnoseError.message : "Failed to run adapter diagnosis."
      });
    }
  };

  const handleCreateWorkspace = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      const companyId =
        createdCompanyId ??
        (
          await api.createCompany({
            name: companyName.trim(),
            description: companyDescription.trim() || null
          })
        ).id;

      if (!createdCompanyId) {
        setCreatedCompanyId(companyId);
      }

      if (!createdAgent) {
        await api.createAgent(companyId, buildAgentPayload(agentDraft));
        setCreatedAgent(true);
      }

      onComplete(companyId);
      await queryClient.invalidateQueries({ queryKey: ["companies"] });
      await queryClient.invalidateQueries({ queryKey: ["agents", companyId] });
      navigate("/");
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Failed to initialize workspace.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl items-center">
        <div className="grid w-full gap-6 lg:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.2fr)]">
          <section className="panel-strong relative overflow-hidden p-7 sm:p-8">
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-44"
              style={{
                background:
                  "radial-gradient(circle at top left, color-mix(in srgb, var(--accent) 24%, transparent), transparent 68%)"
              }}
            />
            <div className="relative">
              <div className="flex items-start justify-between gap-4">
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-3xl border"
                  style={{
                    borderColor: "var(--border-weak)",
                    background: "var(--icon-bg)",
                    color: "var(--icon-text)"
                  }}
                >
                  <Sparkles className="h-7 w-7" />
                </div>
                <ThemeToggle />
              </div>

              <p className="mt-6 text-xs uppercase tracking-[0.34em]" style={{ color: "var(--icon-text)" }}>
                Welcome to AgenticBoard
              </p>
              <h1 className="mt-4 max-w-sm text-3xl font-semibold sm:text-4xl" style={{ color: "var(--text-primary)" }}>
                Stand up your first company workspace and agent runtime.
              </h1>
              <p className="mt-4 max-w-md text-sm leading-7" style={{ color: "var(--text-secondary)" }}>
                This setup creates the first company, provisions the first agent, and verifies that the selected CLI
                adapter can respond from this host.
              </p>

              <div className="mt-8 space-y-3">
                {steps.map(({ number, title, icon: Icon }) => {
                  const isActive = step === number;
                  const isComplete = step > number;

                  return (
                    <div
                      key={number}
                      className="flex items-center gap-4 rounded-3xl border px-4 py-3"
                      style={{
                        borderColor: isActive ? "var(--accent)" : "var(--border-weak)",
                        background: isActive ? "var(--accent-very-soft)" : "var(--card-bg)"
                      }}
                    >
                      <div
                        className="flex h-11 w-11 items-center justify-center rounded-2xl border"
                        style={{
                          borderColor: isActive || isComplete ? "var(--accent)" : "var(--border-weak)",
                          background: isComplete ? "var(--accent)" : "var(--card-strong-bg)",
                          color: isComplete ? "var(--text-on-accent)" : isActive ? "var(--icon-text)" : "var(--text-secondary)"
                        }}
                      >
                        {isComplete ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.24em]" style={{ color: "var(--text-tertiary)" }}>
                          Step {number}
                        </p>
                        <p className="mt-1 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                          {title}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="panel p-6 sm:p-8">
            <div className="mb-8 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.28em]" style={{ color: "var(--text-tertiary)" }}>
                  Step {step} of 3
                </p>
                <h2 className="mt-3 text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>
                  {step === 1
                    ? "Define the company context"
                    : step === 2
                      ? "Create the first agent"
                      : "Test the selected adapter"}
                </h2>
              </div>
              <div
                className="rounded-full px-3 py-2 text-xs font-medium uppercase tracking-[0.24em]"
                style={{ background: "var(--accent-very-soft)", color: "var(--icon-text)" }}
              >
                Fresh install
              </div>
            </div>

            {step === 1 ? (
              <div className="space-y-5">
                <label className="flex flex-col gap-2">
                  <span className="text-xs font-medium uppercase tracking-[0.24em]" style={{ color: "var(--text-tertiary)" }}>
                    Company name
                  </span>
                  <input
                    className="rounded-2xl border px-4 py-3 text-sm outline-none transition focus:border-indigo-400/50"
                    style={controlStyle}
                    value={companyName}
                    onChange={(event) => setCompanyName(event.target.value)}
                    placeholder="Acme Studio"
                  />
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-xs font-medium uppercase tracking-[0.24em]" style={{ color: "var(--text-tertiary)" }}>
                    Description
                  </span>
                  <textarea
                    className="min-h-32 rounded-2xl border px-4 py-3 text-sm outline-none transition focus:border-indigo-400/50"
                    style={controlStyle}
                    value={companyDescription}
                    onChange={(event) => setCompanyDescription(event.target.value)}
                    placeholder="Describe what this workspace is coordinating."
                  />
                </label>
              </div>
            ) : null}

            {step === 2 ? <AgentEditorFields draft={agentDraft} onChange={setAgentDraft} idPrefix="setup-agent" /> : null}

            {step === 3 ? (
              <div className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <SummaryCard label="Company" value={companyName.trim() || "Not set"} detail={companyDescription.trim() || "No description"} />
                  <SummaryCard label="Agent" value={agentDraft.name.trim() || "Not set"} detail={getAdapterSummary(agentDraft)} />
                </div>

                <div
                  className="rounded-[28px] border p-5"
                  style={{ borderColor: "var(--border-weak)", background: "var(--card-bg)" }}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em]" style={{ color: "var(--text-tertiary)" }}>
                        CLI connection test
                      </p>
                      <p className="mt-2 text-sm leading-7" style={{ color: "var(--text-secondary)" }}>
                        Run the adapter diagnose command for <strong style={{ color: "var(--text-primary)" }}>{agentDraft.adapterType}</strong>.
                      </p>
                    </div>
                    <Button onClick={handleRunDiagnosis} disabled={diagnosis.status === "running"}>
                      {diagnosis.status === "running" ? "Testing..." : "Run connection test"}
                    </Button>
                  </div>

                  <div
                    className="mt-4 rounded-2xl border px-4 py-4 text-sm"
                    style={{
                      borderColor:
                        diagnosis.status === "done"
                          ? diagnosis.ok
                            ? "color-mix(in srgb, var(--success) 32%, var(--border-weak))"
                            : "color-mix(in srgb, var(--danger) 32%, var(--border-weak))"
                          : "var(--border-weak)",
                      background:
                        diagnosis.status === "done"
                          ? diagnosis.ok
                            ? "color-mix(in srgb, var(--success) 12%, transparent)"
                            : "color-mix(in srgb, var(--danger) 12%, transparent)"
                          : "var(--card-strong-bg)",
                      color: "var(--text-primary)"
                    }}
                  >
                    {diagnosis.status === "idle" ? "No diagnosis has been run yet." : null}
                    {diagnosis.status === "running" ? "Running adapter diagnosis..." : null}
                    {diagnosis.status === "done" ? diagnosis.message : null}
                  </div>
                </div>
              </div>
            ) : null}

            {error ? (
              <p className="mt-6 text-sm" style={{ color: "var(--danger)" }}>
                {error}
              </p>
            ) : null}

            <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
              <Button variant="ghost" onClick={() => setStep((current) => Math.max(current - 1, 1))} disabled={step === 1 || isSubmitting}>
                Back
              </Button>

              {step < 3 ? (
                <Button onClick={handleNext}>
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleCreateWorkspace} disabled={isSubmitting}>
                  {isSubmitting ? "Creating workspace..." : "Launch dashboard"}
                </Button>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function SummaryCard({
  label,
  value,
  detail
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div
      className="rounded-[28px] border p-5"
      style={{ borderColor: "var(--border-weak)", background: "var(--card-bg)" }}
    >
      <p className="text-xs uppercase tracking-[0.24em]" style={{ color: "var(--text-tertiary)" }}>
        {label}
      </p>
      <p className="mt-3 text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
        {value}
      </p>
      <p className="mt-2 text-sm leading-7" style={{ color: "var(--text-secondary)" }}>
        {detail}
      </p>
    </div>
  );
}

const controlStyle = {
  borderColor: "var(--border-weak)",
  background: "var(--card-strong-bg)",
  color: "var(--text-primary)"
} as const;
