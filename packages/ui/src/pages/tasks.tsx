import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Agent, Project, Task, TaskStatus } from "@agentic-board/shared";
import { ArrowRight, ListTodo, RefreshCcw } from "lucide-react";
import type { SharedPageProps } from "../App";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { api, kanbanStatuses } from "../lib/api";

type TasksPayload = {
  agents: Agent[];
  projects: Project[];
  tasks: Task[];
};

const nextStatusMap: Partial<Record<TaskStatus, TaskStatus>> = {
  backlog: "todo",
  todo: "in_progress",
  in_progress: "in_review",
  in_review: "done"
};

export function TasksPage({ companyId }: SharedPageProps) {
  const queryClient = useQueryClient();
  const tasksQuery = useQuery({
    queryKey: ["tasks-board", companyId],
    queryFn: async (): Promise<TasksPayload> => {
      const [tasks, agents, projects] = await Promise.all([
        api.getTasks(companyId!),
        api.getAgents(companyId!),
        api.getProjects(companyId!)
      ]);

      return { tasks, agents, projects };
    },
    enabled: Boolean(companyId)
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ status, taskId }: { status: TaskStatus; taskId: string }) => api.updateTask(taskId, { status }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["tasks-board", companyId] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard", companyId] })
      ]);
    }
  });

  if (!companyId) {
    return <BoardState message="No company selected." />;
  }

  if (tasksQuery.isLoading) {
    return <BoardState message="Loading tasks..." />;
  }

  if (tasksQuery.isError) {
    return <BoardState message={tasksQuery.error instanceof Error ? tasksQuery.error.message : "Failed to load tasks."} />;
  }

  const data = tasksQuery.data;
  if (!data) {
    return <BoardState message="No task data was returned." />;
  }

  const agentLookup = new Map(data.agents.map((agent) => [agent.id, agent.name]));
  const projectLookup = new Map(data.projects.map((project) => [project.id, project.name]));
  const cancelledCount = data.tasks.filter((task) => task.status === "cancelled").length;

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <CardTitle>Task board</CardTitle>
            <CardDescription>Five-lane delivery flow for backlog, ready work, execution, review, and completion.</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Badge status="cancelled">{cancelledCount} cancelled</Badge>
            <Button variant="outline" onClick={() => tasksQuery.refetch()}>
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>
      </Card>

      <section className="grid gap-4 xl:grid-cols-5">
        {kanbanStatuses.map((status) => {
          const columnTasks = data.tasks.filter((task) => task.status === status);

          return (
            <Card key={status} className="flex min-h-[520px] flex-col">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base capitalize">{status.replaceAll("_", " ")}</CardTitle>
                    <CardDescription>{columnDescription(status)}</CardDescription>
                  </div>
                  <Badge status={status}>{columnTasks.length}</Badge>
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-3">
                {columnTasks.map((task) => {
                  const nextStatus = nextStatusMap[task.status];
                  const projectName = task.projectId ? projectLookup.get(task.projectId) : undefined;
                  const assigneeName = task.assigneeId ? agentLookup.get(task.assigneeId) : undefined;
                  const isMutating =
                    updateTaskMutation.isPending && updateTaskMutation.variables?.taskId === task.id;

                  return (
                    <article key={task.id} className="rounded-3xl border bg-[var(--card-bg)] p-4" style={{ borderColor: "var(--border-weak)" }}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{task.title}</p>
                          <p className="mt-2 text-xs uppercase tracking-[0.24em]" style={{ color: "var(--text-tertiary)" }}>
                            {task.identifier ?? "Unnumbered"}
                          </p>
                        </div>
                        <PriorityPill priority={task.priority} />
                      </div>

                      <p className="mt-3 text-sm" style={{ color: "var(--text-secondary)" }}>
                        {task.description ?? "No description added for this task."}
                      </p>

                      <div className="mt-4 grid gap-2 text-xs" style={{ color: "var(--text-secondary)" }}>
                        <div className="flex items-center justify-between">
                          <span>Project</span>
                          <span style={{ color: "var(--text-primary)" }}>{projectName ?? "Unassigned"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Assignee</span>
                          <span style={{ color: "var(--text-primary)" }}>{assigneeName ?? "Nobody"}</span>
                        </div>
                      </div>

                      {nextStatus ? (
                        <Button
                          variant="ghost"
                          className="mt-4 w-full justify-center border"
                          disabled={isMutating}
                          onClick={() => updateTaskMutation.mutate({ taskId: task.id, status: nextStatus })}
                          style={{ borderColor: "var(--border-weak)" }}
                        >
                          <ArrowRight className="h-4 w-4" />
                          {isMutating ? "Updating..." : `Move to ${nextStatus.replaceAll("_", " ")}`}
                        </Button>
                      ) : null}
                    </article>
                  );
                })}

                {!columnTasks.length ? (
                  <div className="flex flex-1 items-center justify-center rounded-3xl border border-dashed bg-[var(--card-bg)] p-6 text-center" style={{ borderColor: "var(--border-weak)" }}>
                    <div>
                      <ListTodo className="mx-auto h-8 w-8" style={{ color: "var(--text-tertiary)" }} />
                      <p className="mt-3 text-sm" style={{ color: "var(--text-tertiary)" }}>No tasks in this lane.</p>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </section>
    </div>
  );
}

function BoardState({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="flex min-h-[240px] items-center justify-center">
        <p className="text-sm text-slate-400">{message}</p>
      </CardContent>
    </Card>
  );
}

function PriorityPill({ priority }: { priority: Task["priority"] }) {
  const palette: Record<Task["priority"], string> = {
    critical: "border-rose-400/30 bg-rose-400/12 text-rose-200",
    high: "border-amber-400/30 bg-amber-400/12 text-amber-200",
    medium: "border-sky-400/30 bg-sky-400/12 text-sky-200",
    low: "border-slate-400/20 bg-slate-400/10 text-slate-300"
  };

  return <span className={`rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${palette[priority]}`}>{priority}</span>;
}

function columnDescription(status: TaskStatus) {
  switch (status) {
    case "backlog":
      return "Unscheduled discovery";
    case "todo":
      return "Ready to claim";
    case "in_progress":
      return "Work is being executed";
    case "in_review":
      return "Awaiting sign-off";
    case "done":
      return "Closed and verified";
    default:
      return "Additional state";
  }
}
