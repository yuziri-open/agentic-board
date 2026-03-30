import { useQuery } from "@tanstack/react-query";
import { Activity as ActivityIcon, Bot, FolderKanban, FolderRoot, Shapes } from "lucide-react";
import type { SharedPageProps } from "../App";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { api } from "../lib/api";

export function ActivityPage({ companyId }: SharedPageProps) {
  const activityQuery = useQuery({ queryKey: ["activity", companyId], queryFn: async () => { const [activity, agents] = await Promise.all([api.getActivity(companyId!), api.getAgents(companyId!)]); return { activity, agents }; }, enabled: Boolean(companyId) });
  if (!companyId) return <ActivityState message="ワークスペースを選択してください。" />;
  if (activityQuery.isLoading) return <ActivityState message="アクティビティを読み込み中..." />;
  if (activityQuery.isError) return <ActivityState message={activityQuery.error instanceof Error ? activityQuery.error.message : "アクティビティの読み込みに失敗しました。"} />;
  const data = activityQuery.data; if (!data) return <ActivityState message="アクティビティデータが取得できませんでした。" />;
  const agentLookup = new Map(data.agents.map((agent) => [agent.id, agent.name]));
  return <div className="space-y-5"><Card><CardHeader><CardTitle>アクティビティストリーム</CardTitle><CardDescription>ワークスペース、プロジェクト、エージェント、タスクの時系列ログです。</CardDescription></CardHeader></Card><Card><CardContent className="pt-6"><div className="space-y-6">{data.activity.map((entry, index) => { const Icon = pickIcon(entry.targetType); return <div key={entry.id} className="relative flex gap-4">{index < data.activity.length - 1 ? <div className="absolute left-[19px] top-10 h-[calc(100%+1.5rem)] w-px" style={{ background: "linear-gradient(180deg, color-mix(in srgb, var(--accent) 35%, transparent) 0%, transparent 100%)" }} /> : null}<div className="relative mt-1 rounded-full border p-2" style={{ borderColor: "var(--border-weak)", background: "var(--icon-bg)", color: "var(--icon-text)" }}><Icon className="h-4 w-4" /></div><div className="min-w-0 flex-1 rounded-3xl border p-5" style={{ borderColor: "var(--border-weak)", background: "var(--card-bg)" }}><div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between"><div><p className="text-base font-medium" style={{ color: "var(--text-primary)" }}>{humanize(entry.action)}</p><p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>{formatDetails(entry.details)}</p></div><div className="text-sm md:text-right" style={{ color: "var(--text-secondary)" }}><p>{formatDate(entry.createdAt)}</p><p className="mt-1" style={{ color: "var(--text-tertiary)" }}>{entry.agentId ? `実行者: ${agentLookup.get(entry.agentId) ?? entry.agentId}` : "実行者: システム"}</p></div></div></div></div>; })}{!data.activity.length ? <p className="text-center text-sm" style={{ color: "var(--text-tertiary)" }}>アクティビティはまだありません</p> : null}</div></CardContent></Card></div>;
}
function ActivityState({ message }: { message: string }) { return <Card><CardContent className="flex min-h-[220px] items-center justify-center"><p className="text-sm" style={{ color: "var(--text-secondary)" }}>{message}</p></CardContent></Card>; }
function formatDetails(details: Record<string, unknown> | null) { return !details ? "メタデータなし" : Object.entries(details).slice(0, 4).map(([key, value]) => `${humanize(key)}: ${String(value)}`).join(" · "); }
function humanize(value: string) { return value.replaceAll(".", " ").replaceAll("_", " "); }
function formatDate(value: string) { return new Intl.DateTimeFormat("ja-JP", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }
function pickIcon(targetType: string | null) { switch (targetType) { case "agent": return Bot; case "task": return FolderKanban; case "project": return FolderRoot; case "company": return Shapes; default: return ActivityIcon; } }
