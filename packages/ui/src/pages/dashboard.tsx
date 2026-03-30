import { useQuery } from "@tanstack/react-query";
import type { Agent } from "@agentic-board/shared";
import { ArrowUpRight, Bot, BriefcaseBusiness, CalendarDays, CircleCheckBig, FolderKanban, TimerReset } from "lucide-react";
import type { SharedPageProps } from "../App";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardStat, CardTitle } from "../components/ui/card";
import { api, kanbanStatuses, statusLabels } from "../lib/api";

export function DashboardPage({ company, companyId }: SharedPageProps) {
  const dashboardQuery = useQuery({
    queryKey: ["dashboard", companyId],
    queryFn: () => api.getDashboard(companyId!),
    enabled: Boolean(companyId)
  });

  if (!companyId) {
    return <EmptyState message="ワークスペースがまだ作成されていません。セットアップウィザードから作成してください。" />;
  }
  if (dashboardQuery.isLoading) {
    return <EmptyState message="ダッシュボードを読み込み中..." />;
  }
  if (dashboardQuery.isError) {
    return <EmptyState message={dashboardQuery.error instanceof Error ? dashboardQuery.error.message : "ダッシュボードの読み込みに失敗しました。"} />;
  }

  const data = dashboardQuery.data;
  if (!data) {
    return <EmptyState message="データが取得できませんでした" />;
  }

  const summaryCards = [
    { eyebrow: "タスク合計", value: String(data.summary.tasksTotal), trend: `${data.tasksByStatus.backlog.length} バックログ · ${data.tasksByStatus.todo.length} 着手可能`, icon: FolderKanban },
    { eyebrow: "稼働中エージェント", value: `${data.summary.agentsOnline}/${data.summary.agentsTotal}`, trend: `${data.agents.filter((agent) => agent.status === "running").length} 実行中`, icon: Bot },
    { eyebrow: "レビュー待ち", value: String(data.summary.tasksInReview), trend: `${data.summary.tasksDoneToday} 本日完了タスク`, icon: CircleCheckBig },
    { eyebrow: "月間コスト", value: formatCurrency(data.summary.monthlyCostCents), trend: `${data.projects.length} アクティブプロジェクト`, icon: BriefcaseBusiness }
  ];

  return (
    <div className="space-y-5">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.eyebrow} className="relative overflow-hidden">
              <div className="absolute right-4 top-4 rounded-2xl border p-3" style={{ borderColor: "var(--border-weak)", background: "var(--icon-bg)", color: "var(--icon-text)" }}>
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
              <CardTitle>カンバンプレビュー</CardTitle>
              <CardDescription>現在のワークストリームのクイックビュー</CardDescription>
            </div>
            <Badge status="in_progress">{data.summary.tasksInProgress} 進行中</Badge>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              {kanbanStatuses.map((status) => {
                const tasks = data.tasksByStatus[status];
                return (
                  <div key={status} className="rounded-3xl border bg-[var(--card-bg)] p-4" style={{ borderColor: "var(--border-weak)" }}>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{statusLabels[status]}</p>
                      <Badge status={status}>{tasks.length}</Badge>
                    </div>
                    <div className="mt-4 space-y-3">
                      {tasks.slice(0, 3).map((task) => (
                        <div key={task.id} className="rounded-2xl border bg-[var(--card-bg)] p-3" style={{ borderColor: "var(--border-weak)" }}>
                          <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{task.title}</p>
                          <p className="mt-2 text-xs uppercase tracking-[0.2em]" style={{ color: "var(--text-tertiary)" }}>{task.identifier ?? "番号なし"}</p>
                        </div>
                      ))}
                      {!tasks.length ? <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>このレーンにタスクはありません</p> : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute right-[-10%] top-[-10%] h-36 w-36 rounded-full blur-3xl" style={{ background: "color-mix(in srgb, var(--accent) 15%, transparent)" }} />
          <CardHeader>
            <CardTitle>最近のアクティビティ</CardTitle>
            <CardDescription>選択中ワークスペースの最新変更</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.recentActivity.slice(0, 7).map((entry) => (
              <div key={entry.id} className="flex gap-3 rounded-2xl border bg-[var(--card-bg)] p-4" style={{ borderColor: "var(--border-weak)" }}>
                <div className="mt-1 rounded-full border p-2" style={{ background: "var(--icon-bg)", borderColor: "var(--accent)", color: "var(--icon-text)" }}>
                  <TimerReset className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{humanize(entry.action)}</p>
                  <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>{formatDetails(entry.details)}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.2em]" style={{ color: "var(--text-tertiary)" }}>{formatDate(entry.createdAt)}</p>
                </div>
              </div>
            ))}
            {!data.recentActivity.length ? <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>最近のアクティビティはありません</p> : null}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-end justify-between gap-4">
            <div>
              <CardTitle>エージェント一覧</CardTitle>
              <CardDescription>稼働中・待機中・停止中のエージェント</CardDescription>
            </div>
            <Badge status="running">{data.agents.filter(isAgentOnline).length} オンライン</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.agents.slice(0, 5).map((agent) => (
              <div key={agent.id} className="flex items-center justify-between rounded-2xl border bg-[var(--card-bg)] p-4" style={{ borderColor: "var(--border-weak)" }}>
                <div>
                  <p className="font-medium" style={{ color: "var(--text-primary)" }}>{agent.name}</p>
                  <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>{agent.title ?? humanize(agent.role)}</p>
                </div>
                <div className="text-right">
                  <Badge status={agent.status} />
                  <p className="mt-2 text-xs uppercase tracking-[0.2em]" style={{ color: "var(--text-tertiary)" }}>{agent.adapterType.replaceAll("_", " ")}</p>
                </div>
              </div>
            ))}
            {!data.agents.length ? <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>エージェントがありません</p> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-end justify-between gap-4">
            <div>
              <CardTitle>プロジェクト一覧</CardTitle>
              <CardDescription>最近更新されたプロジェクト</CardDescription>
            </div>
            <ArrowUpRight className="h-5 w-5" style={{ color: "var(--icon-text)" }} />
          </CardHeader>
          <CardContent className="space-y-3">
            {data.projects.slice(0, 5).map((project) => (
              <div key={project.id} className="rounded-2xl border bg-[var(--card-bg)] p-4" style={{ borderColor: "var(--border-weak)" }}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium" style={{ color: "var(--text-primary)" }}>{project.name}</p>
                    <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>{project.description ?? "説明なし"}</p>
                  </div>
                  <Badge status={project.status} />
                </div>
                <p className="mt-3 text-xs uppercase tracking-[0.2em]" style={{ color: "var(--text-tertiary)" }}>{project.workspacePath ?? "ワークスペースパス未設定"}</p>
              </div>
            ))}
            {!data.projects.length ? <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>プロジェクトがありません</p> : null}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <Card>
          <CardHeader className="flex flex-row items-end justify-between gap-4">
            <div>
              <CardTitle>📅 カレンダー</CardTitle>
              <CardDescription>GASから取得した今週の予定</CardDescription>
            </div>
            <Badge>同期状態: {data.gasSettings.lastSyncAt ? formatDate(data.gasSettings.lastSyncAt) : "未同期"}</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.calendarEvents.map((event) => (
              <div key={event.id} className="rounded-2xl border bg-[var(--card-bg)] p-4" style={{ borderColor: "var(--border-weak)" }}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium" style={{ color: "var(--text-primary)" }}>{event.title}</p>
                    <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>{formatEventRange(event.start, event.end)}</p>
                  </div>
                  <CalendarDays className="h-5 w-5" style={{ color: "var(--icon-text)" }} />
                </div>
                {event.location ? <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>場所: {event.location}</p> : null}
                {event.description ? <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>{event.description}</p> : null}
              </div>
            ))}
            {!data.calendarEvents.length ? <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>カレンダー予定はありません</p> : null}
          </CardContent>
        </Card>

        <section className="rounded-[2rem] border p-5" style={{ borderColor: "color-mix(in srgb, var(--accent) 52%, var(--border-strong) 48%)", background: "linear-gradient(135deg, color-mix(in srgb, var(--accent) 18%, transparent) 0%, var(--card-strong-bg) 72%)", boxShadow: "0 24px 48px -32px color-mix(in srgb, var(--accent) 35%, transparent)" }}>
          <p className="text-xs uppercase tracking-[0.32em]" style={{ color: "var(--icon-text)" }}>ワークスペース概要</p>
          <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>{company?.name ?? data.company.name}</h2>
              <p className="mt-2 max-w-3xl text-sm" style={{ color: "var(--text-secondary)" }}>{company?.description ?? data.company.description ?? "説明なし"}</p>
            </div>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>キャンセル済みタスク: {data.tasksByStatus.cancelled.length}</p>
          </div>
        </section>
      </section>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return <Card className="min-h-[260px]"><CardContent className="flex min-h-[260px] items-center justify-center"><p className="text-sm" style={{ color: "var(--text-secondary)" }}>{message}</p></CardContent></Card>;
}
function formatCurrency(cents: number) { return new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY", maximumFractionDigits: 0 }).format(cents); }
function humanize(value: string) { return value.replaceAll(".", " ").replaceAll("_", " "); }
function formatDetails(details: Record<string, unknown> | null) { return !details ? "メタデータなし" : Object.entries(details).slice(0, 3).map(([key, value]) => `${humanize(key)}: ${String(value)}`).join(" · "); }
function formatDate(value: string) { return new Intl.DateTimeFormat("ja-JP", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }
function formatEventRange(start: string, end: string | null) { const s = formatDate(start); return end ? `${s} 〜 ${formatDate(end)}` : s; }
function isAgentOnline(agent: Agent) { return agent.status === "running" || Boolean(agent.lastHeartbeatAt && Date.now() - new Date(agent.lastHeartbeatAt).getTime() <= 10 * 60_000); }
