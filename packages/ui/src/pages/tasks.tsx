import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CSSProperties } from "react";
import type { Agent, Project, Task, TaskStatus } from "@kaisha/shared";
import { ArrowRight, ListTodo, RefreshCcw } from "lucide-react";
import type { SharedPageProps } from "../App";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { api, kanbanStatuses, statusLabels } from "../lib/api";

type TasksPayload = { agents: Agent[]; projects: Project[]; tasks: Task[] };
const nextStatusMap: Partial<Record<TaskStatus, TaskStatus>> = { backlog: "todo", todo: "in_progress", in_progress: "in_review", in_review: "done" };

export function TasksPage({ companyId }: SharedPageProps) {
  const queryClient = useQueryClient();
  const tasksQuery = useQuery({
    queryKey: ["tasks-board", companyId],
    queryFn: async (): Promise<TasksPayload> => {
      const [tasks, agents, projects] = await Promise.all([api.getTasks(companyId!), api.getAgents(companyId!), api.getProjects(companyId!)]);
      return { tasks, agents, projects };
    },
    enabled: Boolean(companyId)
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ status, taskId }: { status: TaskStatus; taskId: string }) => api.updateTask(taskId, { status }),
    onSuccess: async () => { await Promise.all([queryClient.invalidateQueries({ queryKey: ["tasks-board", companyId] }), queryClient.invalidateQueries({ queryKey: ["dashboard", companyId] })]); }
  });

  if (!companyId) return <BoardState message="ワークスペースを選択してください。" />;
  if (tasksQuery.isLoading) return <BoardState message="タスクを読み込み中..." />;
  if (tasksQuery.isError) return <BoardState message={tasksQuery.error instanceof Error ? tasksQuery.error.message : "タスクの読み込みに失敗しました。"} />;
  const data = tasksQuery.data; if (!data) return <BoardState message="タスクデータが取得できませんでした" />;

  const agentLookup = new Map(data.agents.map((agent) => [agent.id, agent.name]));
  const projectLookup = new Map(data.projects.map((project) => [project.id, project.name]));
  const cancelledCount = data.tasks.filter((task) => task.status === "cancelled").length;

  return <div className="space-y-5">
    <Card><CardHeader className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><CardTitle>タスクボード</CardTitle><CardDescription>バックログからデリバリーまでの5レーンフロー</CardDescription></div><div className="flex flex-wrap items-center gap-3"><Badge status="cancelled">{cancelledCount} キャンセル</Badge><Button variant="outline" onClick={() => tasksQuery.refetch()}><RefreshCcw className="h-4 w-4" />更新</Button></div></CardHeader></Card>
    <section className="grid gap-4 xl:grid-cols-5">{kanbanStatuses.map((status) => { const columnTasks = data.tasks.filter((task) => task.status === status); return <Card key={status} className="flex min-h-[520px] flex-col"><CardHeader className="pb-4"><div className="flex items-center justify-between gap-3"><div><CardTitle className="text-base">{statusLabels[status]}</CardTitle><CardDescription>{columnDescription(status)}</CardDescription></div><Badge status={status}>{columnTasks.length}</Badge></div></CardHeader><CardContent className="flex flex-1 flex-col gap-3">{columnTasks.map((task) => { const nextStatus = nextStatusMap[task.status]; const projectName = task.projectId ? projectLookup.get(task.projectId) : undefined; const assigneeName = task.assigneeId ? agentLookup.get(task.assigneeId) : undefined; const isMutating = updateTaskMutation.isPending && updateTaskMutation.variables?.taskId === task.id; return <article key={task.id} className="rounded-3xl border bg-[var(--card-bg)] p-4" style={{ borderColor: "var(--border-weak)" }}><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{task.title}</p><p className="mt-2 text-xs uppercase tracking-[0.24em]" style={{ color: "var(--text-tertiary)" }}>{task.identifier ?? "番号なし"}</p></div><PriorityPill priority={task.priority} /></div><p className="mt-3 text-sm" style={{ color: "var(--text-secondary)" }}>{task.description ?? "説明なし"}</p><div className="mt-4 grid gap-2 text-xs" style={{ color: "var(--text-secondary)" }}><div className="flex items-center justify-between"><span>プロジェクト</span><span style={{ color: "var(--text-primary)" }}>{projectName ?? "未割当"}</span></div><div className="flex items-center justify-between"><span>担当者</span><span style={{ color: "var(--text-primary)" }}>{assigneeName ?? "未割当"}</span></div></div>{nextStatus ? <Button variant="ghost" className="mt-4 w-full justify-center border" disabled={isMutating} onClick={() => updateTaskMutation.mutate({ taskId: task.id, status: nextStatus })} style={{ borderColor: "var(--border-weak)" }}><ArrowRight className="h-4 w-4" />{isMutating ? "更新中..." : `→ ${statusLabels[nextStatus]}`}</Button> : null}</article>; })}{!columnTasks.length ? <div className="flex flex-1 items-center justify-center rounded-3xl border border-dashed bg-[var(--card-bg)] p-6 text-center" style={{ borderColor: "var(--border-weak)" }}><div><ListTodo className="mx-auto h-8 w-8" style={{ color: "var(--text-tertiary)" }} /><p className="mt-3 text-sm" style={{ color: "var(--text-tertiary)" }}>このレーンにタスクはありません</p></div></div> : null}</CardContent></Card>; })}</section>
  </div>;
}

function BoardState({ message }: { message: string }) { return <Card><CardContent className="flex min-h-[240px] items-center justify-center"><p className="text-sm" style={{ color: "var(--text-secondary)" }}>{message}</p></CardContent></Card>; }
function PriorityPill({ priority }: { priority: Task["priority"] }) { const palette: Record<Task["priority"], CSSProperties> = { critical: { borderColor: "color-mix(in srgb, var(--danger) 28%, transparent)", background: "color-mix(in srgb, var(--danger) 12%, transparent)", color: "color-mix(in srgb, var(--danger) 72%, var(--text-primary) 28%)" }, high: { borderColor: "color-mix(in srgb, var(--warning) 32%, transparent)", background: "color-mix(in srgb, var(--warning) 14%, transparent)", color: "color-mix(in srgb, var(--warning) 76%, var(--text-primary) 24%)" }, medium: { borderColor: "color-mix(in srgb, var(--accent) 28%, transparent)", background: "color-mix(in srgb, var(--accent) 12%, transparent)", color: "color-mix(in srgb, var(--accent) 78%, var(--text-primary) 22%)" }, low: { borderColor: "var(--border-strong)", background: "var(--surface-soft)", color: "var(--text-secondary)" } }; return <span className="rounded-full border px-2.5 py-1 text-xs font-semibold capitalize" style={palette[priority]}>{priority}</span>; }
function columnDescription(status: TaskStatus) { switch (status) { case "backlog": return "未スケジュール"; case "todo": return "着手可能"; case "in_progress": return "作業中"; case "in_review": return "承認待ち"; case "done": return "完了・検証済み"; default: return "追加状態"; } }
