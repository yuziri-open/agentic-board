import Database from "better-sqlite3";
import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { nanoid } from "nanoid";
import type {
  Activity,
  Agent,
  Company,
  Project,
  Run,
  Task
} from "@agentic-board/shared";
import {
  activities,
  agents,
  companies,
  projects,
  runs,
  schemaSql,
  tasks
} from "./schema.js";

const databasePath = process.env.AGENTIC_BOARD_DB_PATH ?? "agentic-board.sqlite";

export const sqlite = new Database(databasePath);
export const db = drizzle(sqlite);

let initialized = false;

function parseJson<T>(value: string | null): T | null {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function stringArray(value: string | null): string[] {
  const parsed = parseJson<unknown>(value);
  return Array.isArray(parsed) ? parsed.filter((entry): entry is string => typeof entry === "string") : [];
}

export function nowIso(date = new Date()): string {
  return date.toISOString();
}

export function minutesAgo(minutes: number): string {
  return nowIso(new Date(Date.now() - minutes * 60_000));
}

export function generateId(): string {
  return nanoid(12);
}

export function toCompany(row: typeof companies.$inferSelect): Company {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

export function toAgent(row: typeof agents.$inferSelect): Agent {
  return {
    id: row.id,
    companyId: row.companyId,
    name: row.name,
    role: row.role as Agent["role"],
    title: row.title,
    capabilities: stringArray(row.capabilities),
    adapterType: row.adapterType as Agent["adapterType"],
    adapterConfig: parseJson<Record<string, unknown>>(row.adapterConfig),
    reportsTo: row.reportsTo,
    status: row.status as Agent["status"],
    budgetMonthlyCents: row.budgetMonthlyCents,
    spentMonthlyCents: row.spentMonthlyCents,
    lastHeartbeatAt: row.lastHeartbeatAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

export function toTask(row: typeof tasks.$inferSelect): Task {
  return {
    id: row.id,
    companyId: row.companyId,
    projectId: row.projectId,
    parentId: row.parentId,
    title: row.title,
    description: row.description,
    status: row.status as Task["status"],
    priority: row.priority as Task["priority"],
    assigneeId: row.assigneeId,
    taskNumber: row.taskNumber,
    identifier: row.identifier,
    startedAt: row.startedAt,
    completedAt: row.completedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

export function toProject(row: typeof projects.$inferSelect): Project {
  return {
    id: row.id,
    companyId: row.companyId,
    name: row.name,
    description: row.description,
    status: row.status as Project["status"],
    workspacePath: row.workspacePath,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

export function toRun(row: typeof runs.$inferSelect): Run {
  return {
    id: row.id,
    agentId: row.agentId,
    taskId: row.taskId,
    status: row.status as Run["status"],
    adapterType: row.adapterType as Run["adapterType"],
    stdout: row.stdout,
    stderr: row.stderr,
    costCents: row.costCents,
    tokensUsed: row.tokensUsed,
    startedAt: row.startedAt,
    completedAt: row.completedAt,
    durationMs: row.durationMs
  };
}

export function toActivity(row: typeof activities.$inferSelect): Activity {
  return {
    id: row.id,
    companyId: row.companyId,
    agentId: row.agentId,
    action: row.action,
    targetType: row.targetType,
    targetId: row.targetId,
    details: parseJson<Record<string, unknown>>(row.details),
    createdAt: row.createdAt
  };
}

function seedDatabase(): void {
  if (db.select().from(companies).limit(1).get()) {
    return;
  }

  const companyId = generateId();
  const seoProjectId = generateId();
  const platformProjectId = generateId();
  const ceoId = generateId();
  const managerId = generateId();
  const workerId = generateId();
  const [taskA, taskB, taskC, taskD, taskE] = Array.from({ length: 5 }, () => generateId());

  db.insert(companies)
    .values({
      id: companyId,
      name: "Iori Corp",
      description: "Autonomous SEO and product operations studio.",
      createdAt: minutesAgo(180),
      updatedAt: minutesAgo(5)
    })
    .run();

  db.insert(projects)
    .values([
      {
        id: seoProjectId,
        companyId,
        name: "SEO Ops",
        description: "Content system for organic growth.",
        status: "active",
        workspacePath: "C:/workspace/iori/seo",
        createdAt: minutesAgo(160),
        updatedAt: minutesAgo(20)
      },
      {
        id: platformProjectId,
        companyId,
        name: "Platform",
        description: "Agent orchestration and dashboard improvements.",
        status: "active",
        workspacePath: "C:/workspace/iori/platform",
        createdAt: minutesAgo(155),
        updatedAt: minutesAgo(40)
      }
    ])
    .run();

  db.insert(agents)
    .values([
      {
        id: ceoId,
        companyId,
        name: "Jack",
        role: "ceo",
        title: "Orchestrator",
        capabilities: JSON.stringify(["triage", "planning", "budgeting"]),
        adapterType: "claude_code",
        adapterConfig: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          permissionMode: "bypassPermissions"
        }),
        status: "idle",
        budgetMonthlyCents: 250000,
        spentMonthlyCents: 4230,
        lastHeartbeatAt: minutesAgo(8),
        createdAt: minutesAgo(150),
        updatedAt: minutesAgo(8)
      },
      {
        id: managerId,
        companyId,
        name: "Guard",
        role: "manager",
        title: "Review Lead",
        capabilities: JSON.stringify(["review", "qa", "handoff"]),
        adapterType: "codex",
        adapterConfig: JSON.stringify({ model: "gpt-5.4-codex", approval: "full-auto" }),
        reportsTo: ceoId,
        status: "running",
        budgetMonthlyCents: 180000,
        spentMonthlyCents: 2110,
        lastHeartbeatAt: minutesAgo(2),
        createdAt: minutesAgo(145),
        updatedAt: minutesAgo(2)
      },
      {
        id: workerId,
        companyId,
        name: "Pen",
        role: "worker",
        title: "Content Operator",
        capabilities: JSON.stringify(["drafting", "research", "publishing"]),
        adapterType: "shell",
        adapterConfig: JSON.stringify({ command: "echo AgenticBoard worker ready", shell: "powershell" }),
        reportsTo: managerId,
        status: "idle",
        budgetMonthlyCents: 120000,
        spentMonthlyCents: 980,
        lastHeartbeatAt: minutesAgo(4),
        createdAt: minutesAgo(140),
        updatedAt: minutesAgo(4)
      }
    ])
    .run();

  db.insert(tasks)
    .values([
      {
        id: taskA,
        companyId,
        projectId: seoProjectId,
        title: "Refresh landing page title map",
        description: "Rework title and H1 alignment for core service pages.",
        status: "backlog",
        priority: "high",
        taskNumber: 42,
        identifier: "SEO-42",
        createdAt: minutesAgo(120),
        updatedAt: minutesAgo(70)
      },
      {
        id: taskB,
        companyId,
        projectId: seoProjectId,
        title: "Prepare comparison article outline",
        description: "Draft outline for competitor comparison article.",
        status: "todo",
        priority: "medium",
        assigneeId: workerId,
        taskNumber: 44,
        identifier: "SEO-44",
        createdAt: minutesAgo(110),
        updatedAt: minutesAgo(30)
      },
      {
        id: taskC,
        companyId,
        projectId: seoProjectId,
        title: "Review fact-check notes",
        description: "Validate source quality before publication.",
        status: "in_progress",
        priority: "critical",
        assigneeId: managerId,
        taskNumber: 45,
        identifier: "SEO-45",
        startedAt: minutesAgo(40),
        createdAt: minutesAgo(105),
        updatedAt: minutesAgo(10)
      },
      {
        id: taskD,
        companyId,
        projectId: seoProjectId,
        title: "Approve revised slug structure",
        description: "Confirm URL pattern consistency with sitemap.",
        status: "in_review",
        priority: "high",
        assigneeId: managerId,
        taskNumber: 47,
        identifier: "SEO-47",
        startedAt: minutesAgo(90),
        createdAt: minutesAgo(100),
        updatedAt: minutesAgo(5)
      },
      {
        id: taskE,
        companyId,
        projectId: platformProjectId,
        title: "Ship dashboard skeleton",
        description: "Implement MVP board and activity feed.",
        status: "done",
        priority: "medium",
        assigneeId: workerId,
        taskNumber: 48,
        identifier: "PLT-48",
        startedAt: minutesAgo(180),
        completedAt: minutesAgo(20),
        createdAt: minutesAgo(95),
        updatedAt: minutesAgo(20)
      }
    ])
    .run();

  db.insert(runs)
    .values([
      {
        id: generateId(),
        agentId: workerId,
        taskId: taskE,
        status: "success",
        adapterType: "shell",
        stdout: "Dashboard MVP built.",
        stderr: "",
        costCents: 1260,
        tokensUsed: 18500,
        startedAt: minutesAgo(180),
        completedAt: minutesAgo(20),
        durationMs: 210000
      },
      {
        id: generateId(),
        agentId: managerId,
        taskId: taskD,
        status: "running",
        adapterType: "codex",
        stdout: "Reviewing workspace changes...",
        stderr: "",
        costCents: 2970,
        tokensUsed: 40200,
        startedAt: minutesAgo(15),
        durationMs: 900000
      }
    ])
    .run();

  db.insert(activities)
    .values([
      {
        id: generateId(),
        companyId,
        agentId: workerId,
        action: "task.completed",
        targetType: "task",
        targetId: taskE,
        details: JSON.stringify({ identifier: "PLT-48", title: "Ship dashboard skeleton" }),
        createdAt: minutesAgo(20)
      },
      {
        id: generateId(),
        companyId,
        agentId: managerId,
        action: "task.review_started",
        targetType: "task",
        targetId: taskD,
        details: JSON.stringify({ identifier: "SEO-47", title: "Approve revised slug structure" }),
        createdAt: minutesAgo(12)
      },
      {
        id: generateId(),
        companyId,
        agentId: ceoId,
        action: "task.assigned",
        targetType: "task",
        targetId: taskB,
        details: JSON.stringify({ identifier: "SEO-44", assignee: "Pen" }),
        createdAt: minutesAgo(30)
      }
    ])
    .run();
}

function shouldSeedDatabase(): boolean {
  return process.env.AGENTIC_BOARD_SEED === "demo";
}

export function initializeDatabase(): void {
  if (initialized) {
    return;
  }

  sqlite.pragma("foreign_keys = ON");
  sqlite.exec(schemaSql.join("\n"));
  if (shouldSeedDatabase()) {
    seedDatabase();
  }
  initialized = true;
}

export function getCompanyById(companyId: string): Company | null {
  const row = db.select().from(companies).where(eq(companies.id, companyId)).get();
  return row ? toCompany(row) : null;
}

export function listCompanyChildren(companyId: string): {
  agents: Agent[];
  projects: Project[];
  tasks: Task[];
  recentActivity: Activity[];
} {
  return {
    agents: db.select().from(agents).where(eq(agents.companyId, companyId)).orderBy(agents.name).all().map(toAgent),
    projects: db
      .select()
      .from(projects)
      .where(eq(projects.companyId, companyId))
      .orderBy(projects.updatedAt, projects.name)
      .all()
      .map(toProject),
    tasks: db.select().from(tasks).where(eq(tasks.companyId, companyId)).orderBy(desc(tasks.updatedAt)).all().map(toTask),
    recentActivity: db
      .select()
      .from(activities)
      .where(eq(activities.companyId, companyId))
      .orderBy(desc(activities.createdAt))
      .limit(25)
      .all()
      .map(toActivity)
  };
}

export function agentBelongsToCompany(agentId: string, companyId: string): boolean {
  return Boolean(
    db
      .select({ id: agents.id })
      .from(agents)
      .where(and(eq(agents.id, agentId), eq(agents.companyId, companyId)))
      .get()
  );
}

initializeDatabase();
