import type { Activity, Agent, Company, DashboardResponse, Project, Task, TaskStatus } from "@agentic-board/shared";

const BASE_URL = "/api";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

async function request<T>(path: string, init: RequestOptions = {}): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init.headers
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body)
  });

  if (!response.ok) {
    const fallback = `${response.status} ${response.statusText}`.trim();
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(payload?.error ?? fallback, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const api = {
  listCompanies: () => request<Company[]>("/companies"),
  getAgents: (companyId: string) => request<Agent[]>(`/companies/${companyId}/agents`),
  getTasks: (companyId: string) => request<Task[]>(`/companies/${companyId}/tasks`),
  getProjects: (companyId: string) => request<Project[]>(`/companies/${companyId}/projects`),
  getDashboard: (companyId: string) => request<DashboardResponse>(`/companies/${companyId}/dashboard`),
  getActivity: (companyId: string) => request<Activity[]>(`/companies/${companyId}/activity`),
  createTask: (companyId: string, payload: Partial<Task>) =>
    request<Task>(`/companies/${companyId}/tasks`, {
      method: "POST",
      body: payload
    }),
  updateTask: (taskId: string, payload: Partial<Pick<Task, "status" | "title" | "description" | "priority" | "assigneeId" | "projectId" | "parentId">>) =>
    request<Task>(`/tasks/${taskId}`, {
      method: "PATCH",
      body: payload
    })
};

export const kanbanStatuses: TaskStatus[] = ["backlog", "todo", "in_progress", "in_review", "done"];
