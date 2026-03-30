import type { DashboardResponse, TaskStatus } from "@agentic-board/shared";
import { Hono } from "hono";
import { getCompanyById, listCompanyChildren } from "../db/index.js";
import { getDashboardCalendar } from "./settings.js";

const taskStatuses: TaskStatus[] = ["backlog", "todo", "in_progress", "in_review", "done", "cancelled"];

export const dashboardRoutes = new Hono();

dashboardRoutes.get("/companies/:companyId/dashboard", async (c) => {
  const company = getCompanyById(c.req.param("companyId"));
  if (!company) {
    return c.json({ error: "company not found" }, 404);
  }

  const { agents, projects, recentActivity, tasks } = listCompanyChildren(company.id);
  const { settings: gasSettings, calendarEvents } = await getDashboardCalendar();
  const today = new Date().toDateString();
  const grouped = Object.fromEntries(taskStatuses.map((status) => [status, [] as typeof tasks])) as unknown as Record<TaskStatus, typeof tasks>;

  for (const task of tasks) {
    grouped[task.status].push(task);
  }

  const payload: DashboardResponse = {
    company,
    summary: {
      tasksTotal: tasks.length,
      tasksInProgress: grouped.in_progress.length,
      tasksInReview: grouped.in_review.length,
      tasksDoneToday: tasks.filter((task) => task.completedAt && new Date(task.completedAt).toDateString() === today).length,
      agentsTotal: agents.length,
      agentsOnline: agents.filter((agent) => {
        if (agent.status === "running") {
          return true;
        }

        return agent.lastHeartbeatAt
          ? Date.now() - new Date(agent.lastHeartbeatAt).getTime() <= 10 * 60_000
          : false;
      }).length,
      monthlyCostCents: agents.reduce((total, agent) => total + agent.spentMonthlyCents, 0)
    },
    tasksByStatus: grouped,
    agents,
    projects,
    recentActivity,
    gasSettings,
    calendarEvents
  };

  return c.json(payload);
});
