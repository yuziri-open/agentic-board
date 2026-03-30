import { and, desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { db, generateId, nowIso, toAgent, toRun } from "../db/index.js";
import { agents, runs } from "../db/schema.js";
import { logActivity } from "../services/activity.js";
import { claudeCodeAdapter } from "../adapters/claude-code.js";
import { codexAdapter } from "../adapters/codex.js";
import { shellAdapter } from "../adapters/shell.js";
import type { ExecutionContext, ExecutionResult } from "../adapters/types.js";

export const agentsRoutes = new Hono();

// List agents for a company
agentsRoutes.get("/companies/:companyId/agents", (c) => {
  const rows = db
    .select()
    .from(agents)
    .where(eq(agents.companyId, c.req.param("companyId")))
    .orderBy(agents.name)
    .all()
    .map(toAgent);
  return c.json(rows);
});

// Create agent
agentsRoutes.post("/companies/:companyId/agents", async (c) => {
  const companyId = c.req.param("companyId");
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const name = typeof body.name === "string" ? body.name.trim() : "";

  if (!name) {
    return c.json({ error: "name is required" }, 400);
  }

  const adapterType = typeof body.adapterType === "string" ? body.adapterType : "shell";
  const createdAt = nowIso();
  const row = {
    id: generateId(),
    companyId,
    name,
    role: typeof body.role === "string" ? body.role : "worker",
    title: typeof body.title === "string" ? body.title : null,
    capabilities: Array.isArray(body.capabilities) ? JSON.stringify(body.capabilities) : typeof body.capabilities === "string" ? body.capabilities : null,
    adapterType,
    adapterConfig: body.adapterConfig ? JSON.stringify(body.adapterConfig) : null,
    reportsTo: typeof body.reportsTo === "string" ? body.reportsTo : null,
    status: "idle",
    budgetMonthlyCents: typeof body.budgetMonthlyCents === "number" ? body.budgetMonthlyCents : 0,
    spentMonthlyCents: 0,
    lastHeartbeatAt: null,
    createdAt,
    updatedAt: createdAt,
  };

  db.insert(agents).values(row).run();
  logActivity({
    companyId,
    action: "agent.created",
    targetType: "agent",
    targetId: row.id,
    details: { name: row.name, role: row.role },
  });

  return c.json(toAgent(row), 201);
});

// Get agent
agentsRoutes.get("/agents/:id", (c) => {
  const row = db.select().from(agents).where(eq(agents.id, c.req.param("id"))).get();
  return row ? c.json(toAgent(row)) : c.json({ error: "agent not found" }, 404);
});

// Update agent
agentsRoutes.patch("/agents/:id", async (c) => {
  const id = c.req.param("id");
  const current = db.select().from(agents).where(eq(agents.id, id)).get();
  if (!current) return c.json({ error: "agent not found" }, 404);

  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;

  db.update(agents)
    .set({
      name: typeof body.name === "string" ? body.name.trim() || current.name : current.name,
      role: typeof body.role === "string" ? body.role : current.role,
      title: typeof body.title === "string" ? body.title : current.title,
      capabilities: Array.isArray(body.capabilities) ? JSON.stringify(body.capabilities) : current.capabilities,
      adapterType: typeof body.adapterType === "string" ? body.adapterType : current.adapterType,
      adapterConfig: body.adapterConfig ? JSON.stringify(body.adapterConfig) : current.adapterConfig,
      reportsTo: typeof body.reportsTo === "string" ? body.reportsTo : current.reportsTo,
      status: typeof body.status === "string" ? body.status : current.status,
      budgetMonthlyCents: typeof body.budgetMonthlyCents === "number" ? body.budgetMonthlyCents : current.budgetMonthlyCents,
      updatedAt: nowIso(),
    })
    .where(eq(agents.id, id))
    .run();

  const updated = db.select().from(agents).where(eq(agents.id, id)).get();
  if (!updated) return c.json({ error: "agent not found" }, 404);

  logActivity({
    companyId: current.companyId,
    action: "agent.updated",
    targetType: "agent",
    targetId: id,
  });

  return c.json(toAgent(updated));
});

// Delete agent
agentsRoutes.delete("/agents/:id", (c) => {
  const id = c.req.param("id");
  const current = db.select().from(agents).where(eq(agents.id, id)).get();
  if (!current) return c.json({ error: "agent not found" }, 404);

  db.delete(agents).where(eq(agents.id, id)).run();
  logActivity({
    companyId: current.companyId,
    action: "agent.deleted",
    targetType: "agent",
    targetId: id,
    details: { name: current.name },
  });

  return c.body(null, 204);
});

// Get agent runs
agentsRoutes.get("/agents/:id/runs", (c) => {
  const rows = db
    .select()
    .from(runs)
    .where(eq(runs.agentId, c.req.param("id")))
    .orderBy(desc(runs.startedAt))
    .limit(50)
    .all()
    .map(toRun);
  return c.json(rows);
});

// Invoke agent (manual heartbeat)
agentsRoutes.post("/agents/:id/invoke", async (c) => {
  const id = c.req.param("id");
  const agent = db.select().from(agents).where(eq(agents.id, id)).get();
  if (!agent) return c.json({ error: "agent not found" }, 404);

  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const prompt = typeof body.prompt === "string" ? body.prompt : "Perform your next task.";
  const taskId = typeof body.taskId === "string" ? body.taskId : null;

  // Update agent status to running
  db.update(agents)
    .set({ status: "running", lastHeartbeatAt: nowIso(), updatedAt: nowIso() })
    .where(eq(agents.id, id))
    .run();

  const agentData = toAgent(agent);
  const context: ExecutionContext = {
    agent: agentData,
    prompt,
    workingDir: process.cwd(),
  };

  // Create run record
  const runId = generateId();
  const startedAt = nowIso();
  db.insert(runs).values({
    id: runId,
    agentId: id,
    taskId,
    status: "running",
    adapterType: agent.adapterType,
    startedAt,
  }).run();

  logActivity({
    companyId: agent.companyId,
    agentId: id,
    action: "agent.invoked",
    targetType: "agent",
    targetId: id,
    details: { prompt: prompt.slice(0, 100) },
  });

  // Execute adapter
  let result: ExecutionResult;
  try {
    switch (agent.adapterType) {
      case "claude_code":
        result = await claudeCodeAdapter.execute(context);
        break;
      case "codex":
        result = await codexAdapter.execute(context);
        break;
      case "shell":
        result = await shellAdapter.execute(context);
        break;
      default:
        result = { status: "error", stdout: "", stderr: `Unknown adapter: ${agent.adapterType}`, durationMs: 0 };
    }
  } catch (err) {
    result = {
      status: "error",
      stdout: "",
      stderr: err instanceof Error ? err.message : String(err),
      durationMs: 0,
    };
  }

  // Update run
  const completedAt = nowIso();
  db.update(runs)
    .set({
      status: result.status,
      stdout: result.stdout,
      stderr: result.stderr,
      costCents: result.costCents ?? 0,
      tokensUsed: result.tokensUsed ?? 0,
      completedAt,
      durationMs: result.durationMs,
    })
    .where(eq(runs.id, runId))
    .run();

  // Update agent status
  db.update(agents)
    .set({
      status: result.status === "success" ? "idle" : "error",
      spentMonthlyCents: agent.spentMonthlyCents + (result.costCents ?? 0),
      updatedAt: completedAt,
    })
    .where(eq(agents.id, id))
    .run();

  const runRow = db.select().from(runs).where(eq(runs.id, runId)).get();
  return c.json(runRow ? toRun(runRow) : { id: runId, status: result.status });
});
