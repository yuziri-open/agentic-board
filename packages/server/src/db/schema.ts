import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const companies = sqliteTable(
  "companies",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`)
  },
  (table) => ({
    nameIdx: index("companies_name_idx").on(table.name)
  })
);

export const projects = sqliteTable(
  "projects",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id")
      .notNull()
      .references(() => companies.id),
    name: text("name").notNull(),
    description: text("description"),
    status: text("status").notNull().default("active"),
    workspacePath: text("workspace_path"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`)
  },
  (table) => ({
    companyIdx: index("projects_company_idx").on(table.companyId)
  })
);

export const agents = sqliteTable(
  "agents",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id")
      .notNull()
      .references(() => companies.id),
    name: text("name").notNull(),
    role: text("role").notNull().default("worker"),
    title: text("title"),
    capabilities: text("capabilities"),
    adapterType: text("adapter_type").notNull(),
    adapterConfig: text("adapter_config"),
    reportsTo: text("reports_to").references(() => agents.id),
    status: text("status").notNull().default("idle"),
    budgetMonthlyCents: integer("budget_monthly_cents").notNull().default(0),
    spentMonthlyCents: integer("spent_monthly_cents").notNull().default(0),
    lastHeartbeatAt: text("last_heartbeat_at"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`)
  },
  (table) => ({
    companyIdx: index("agents_company_idx").on(table.companyId),
    managerIdx: index("agents_reports_to_idx").on(table.reportsTo)
  })
);

export const tasks = sqliteTable(
  "tasks",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id")
      .notNull()
      .references(() => companies.id),
    projectId: text("project_id").references(() => projects.id),
    parentId: text("parent_id").references(() => tasks.id),
    title: text("title").notNull(),
    description: text("description"),
    status: text("status").notNull().default("backlog"),
    priority: text("priority").notNull().default("medium"),
    assigneeId: text("assignee_id").references(() => agents.id),
    taskNumber: integer("task_number"),
    identifier: text("identifier"),
    startedAt: text("started_at"),
    completedAt: text("completed_at"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`)
  },
  (table) => ({
    companyIdx: index("tasks_company_idx").on(table.companyId),
    projectIdx: index("tasks_project_idx").on(table.projectId),
    assigneeIdx: index("tasks_assignee_idx").on(table.assigneeId),
    parentIdx: index("tasks_parent_idx").on(table.parentId)
  })
);

export const runs = sqliteTable(
  "runs",
  {
    id: text("id").primaryKey(),
    agentId: text("agent_id")
      .notNull()
      .references(() => agents.id),
    taskId: text("task_id").references(() => tasks.id),
    status: text("status").notNull().default("running"),
    adapterType: text("adapter_type").notNull(),
    stdout: text("stdout"),
    stderr: text("stderr"),
    costCents: integer("cost_cents").notNull().default(0),
    tokensUsed: integer("tokens_used").notNull().default(0),
    startedAt: text("started_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    completedAt: text("completed_at"),
    durationMs: integer("duration_ms")
  },
  (table) => ({
    agentIdx: index("runs_agent_idx").on(table.agentId),
    taskIdx: index("runs_task_idx").on(table.taskId)
  })
);

export const activities = sqliteTable(
  "activities",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull(),
    agentId: text("agent_id"),
    action: text("action").notNull(),
    targetType: text("target_type"),
    targetId: text("target_id"),
    details: text("details"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`)
  },
  (table) => ({
    companyIdx: index("activities_company_idx").on(table.companyId),
    createdIdx: index("activities_created_at_idx").on(table.createdAt)
  })
);

export const schemaSql = [
  `CREATE TABLE IF NOT EXISTS companies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );`,
  `CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL REFERENCES companies(id),
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    workspace_path TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );`,
  `CREATE TABLE IF NOT EXISTS agents (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL REFERENCES companies(id),
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'worker',
    title TEXT,
    capabilities TEXT,
    adapter_type TEXT NOT NULL,
    adapter_config TEXT,
    reports_to TEXT REFERENCES agents(id),
    status TEXT NOT NULL DEFAULT 'idle',
    budget_monthly_cents INTEGER NOT NULL DEFAULT 0,
    spent_monthly_cents INTEGER NOT NULL DEFAULT 0,
    last_heartbeat_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );`,
  `CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL REFERENCES companies(id),
    project_id TEXT REFERENCES projects(id),
    parent_id TEXT REFERENCES tasks(id),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'backlog',
    priority TEXT NOT NULL DEFAULT 'medium',
    assignee_id TEXT REFERENCES agents(id),
    task_number INTEGER,
    identifier TEXT,
    started_at TEXT,
    completed_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );`,
  `CREATE TABLE IF NOT EXISTS runs (
    id TEXT PRIMARY KEY,
    agent_id TEXT NOT NULL REFERENCES agents(id),
    task_id TEXT REFERENCES tasks(id),
    status TEXT NOT NULL DEFAULT 'running',
    adapter_type TEXT NOT NULL,
    stdout TEXT,
    stderr TEXT,
    cost_cents INTEGER NOT NULL DEFAULT 0,
    tokens_used INTEGER NOT NULL DEFAULT 0,
    started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TEXT,
    duration_ms INTEGER
  );`,
  `CREATE TABLE IF NOT EXISTS activities (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    agent_id TEXT,
    action TEXT NOT NULL,
    target_type TEXT,
    target_id TEXT,
    details TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );`,
  `CREATE INDEX IF NOT EXISTS agents_company_idx ON agents(company_id);`,
  `CREATE INDEX IF NOT EXISTS projects_company_idx ON projects(company_id);`,
  `CREATE INDEX IF NOT EXISTS tasks_company_idx ON tasks(company_id);`,
  `CREATE INDEX IF NOT EXISTS tasks_project_idx ON tasks(project_id);`,
  `CREATE INDEX IF NOT EXISTS runs_agent_idx ON runs(agent_id);`,
  `CREATE INDEX IF NOT EXISTS activities_company_idx ON activities(company_id);`
] as const;
