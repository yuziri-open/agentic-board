import { useQuery } from "@tanstack/react-query";
import { FolderGit2, HardDriveDownload, Rows2 } from "lucide-react";
import type { SharedPageProps } from "../App";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { api } from "../lib/api";

export function ProjectsPage({ companyId }: SharedPageProps) {
  const projectsQuery = useQuery({
    queryKey: ["projects", companyId],
    queryFn: async () => {
      const [projects, tasks] = await Promise.all([api.getProjects(companyId!), api.getTasks(companyId!)]);
      return { projects, tasks };
    },
    enabled: Boolean(companyId)
  });

  if (!companyId) {
    return <ProjectsState message="No company selected." />;
  }

  if (projectsQuery.isLoading) {
    return <ProjectsState message="Loading projects..." />;
  }

  if (projectsQuery.isError) {
    return <ProjectsState message={projectsQuery.error instanceof Error ? projectsQuery.error.message : "Failed to load projects."} />;
  }

  const data = projectsQuery.data;
  if (!data) {
    return <ProjectsState message="Project payload was empty." />;
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>Project registry</CardTitle>
          <CardDescription>Each project card shows workspace location, current status, and linked task volume.</CardDescription>
        </CardHeader>
      </Card>

      <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {data.projects.map((project) => {
          const linkedTasks = data.tasks.filter((task) => task.projectId === project.id);
          const doneCount = linkedTasks.filter((task) => task.status === "done").length;

          return (
            <Card key={project.id} className="relative overflow-hidden">
              <div
                className="absolute inset-x-6 top-0 h-px"
                style={{
                  background:
                    "linear-gradient(90deg, transparent 0%, color-mix(in srgb, var(--accent) 40%, transparent) 50%, transparent 100%)"
                }}
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
                      <FolderGit2 className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{project.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {project.description ?? "No project description provided."}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge status={project.status} />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <InfoTile icon={Rows2} label="Linked tasks" value={String(linkedTasks.length)} />
                  <InfoTile icon={HardDriveDownload} label="Done" value={String(doneCount)} />
                </div>

                <div
                  className="rounded-2xl border p-4"
                  style={{ borderColor: "var(--border-weak)", background: "var(--card-bg)" }}
                >
                  <p className="text-xs uppercase tracking-[0.24em]" style={{ color: "var(--text-tertiary)" }}>
                    Workspace path
                  </p>
                  <p className="mt-3 break-all text-sm" style={{ color: "var(--text-primary)" }}>
                    {project.workspacePath ?? "Not configured"}
                  </p>
                </div>

                <div className="flex items-center justify-between text-sm" style={{ color: "var(--text-secondary)" }}>
                  <span>Updated</span>
                  <span>{formatDate(project.updatedAt)}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      {!data.projects.length ? <ProjectsState message="No projects returned for this company." /> : null}
    </div>
  );
}

function InfoTile({
  icon: Icon,
  label,
  value
}: {
  icon: typeof FolderGit2;
  label: string;
  value: string;
}) {
  return (
    <div
      className="rounded-2xl border p-3"
      style={{ borderColor: "var(--border-weak)", background: "var(--surface-soft)" }}
    >
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em]" style={{ color: "var(--text-tertiary)" }}>
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <p className="mt-3 text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
        {value}
      </p>
    </div>
  );
}

function ProjectsState({ message }: { message: string }) {
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

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium"
  }).format(new Date(value));
}
