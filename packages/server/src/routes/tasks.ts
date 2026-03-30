import { and, desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { db, generateId, nowIso, toTask } from "../db/index.js";
import { tasks } from "../db/schema.js";
import { logActivity } from "../services/activity.js";

export const tasksRoutes = new Hono();

// List tasks for a company
tasksRoutes.get("/companies/:companyId/tasks", (c) => {
  const companyId = c.req.param("companyId");
  const status = c.req.query("status");
  const assigneeAgentId = c.req.query("assigneeAgentId");
  const projectId = c.req.query("projectId");

  let query = db.select().from(tasks).where(eq(tasks.companyId, companyId));

  // Note: additional filters applied post-query for simplicity in SQLite
  let rows = query.orderBy(desc(tasks.updatedAt)).all().map(toTask);

  if (status) {
    const statuses = status.split(",").map((s) => s.trim());
    rows = rows.filter((t) => statuses.includes(t.status));
  }
  if (assigneeAgentId) {
    rows = rows.filter((t) => t.assigneeId === assigneeAgentId);
  }
  if (projectId) {
    rows = rows.filter((t) => t.projectId === projectId);
  }

  return c.json(rows);
});

// Create task
tasksRoutes.post("/companies/:companyId/tasks", async (c) => {
  const companyId = c.req.param("companyId");
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const title = typeof body.title === "string" ? body.title.trim() : "";

  if (!title) {
    return c.json({ error: "title is required" }, 400);
  }

  // Auto-increment task number
  const lastTask = db
    .select()
    .from(tasks)
    .where(eq(tasks.companyId, companyId))
    .orderBy(desc(tasks.taskNumber))
    .limit(1)
    .get();
  const taskNumber = (lastTask?.taskNumber ?? 0) + 1;
  const identifier = `TASK-${taskNumber}`;

  const createdAt = nowIso();
  const row = {
    id: generateId(),
    companyId,
    projectId: typeof body.projectId === "string" ? body.projectId : null,
    parentId: typeof body.parentId === "string" ? body.parentId : null,
    title,
    description: typeof body.description === "string" ? body.description : null,
    status: typeof body.status === "string" ? body.status : "backlog",
    priority: typeof body.priority === "string" ? body.priority : "medium",
    assigneeId: typeof body.assigneeId === "string" ? body.assigneeId : null,
    taskNumber,
    identifier,
    startedAt: null,
    completedAt: null,
    createdAt,
    updatedAt: createdAt,
  };

  db.insert(tasks).values(row).run();
  logActivity({
    companyId,
    action: "task.created",
    targetType: "task",
    targetId: row.id,
    details: { title: row.title, identifier, priority: row.priority },
  });

  return c.json(toTask(row), 201);
});

// Get task
tasksRoutes.get("/tasks/:id", (c) => {
  const row = db.select().from(tasks).where(eq(tasks.id, c.req.param("id"))).get();
  return row ? c.json(toTask(row)) : c.json({ error: "task not found" }, 404);
});

// Update task
tasksRoutes.patch("/tasks/:id", async (c) => {
  const id = c.req.param("id");
  const current = db.select().from(tasks).where(eq(tasks.id, id)).get();
  if (!current) return c.json({ error: "task not found" }, 404);

  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const newStatus = typeof body.status === "string" ? body.status : current.status;

  // Auto-set timestamps
  let startedAt = current.startedAt;
  let completedAt = current.completedAt;
  if (newStatus === "in_progress" && !current.startedAt) {
    startedAt = nowIso();
  }
  if ((newStatus === "done" || newStatus === "cancelled") && !current.completedAt) {
    completedAt = nowIso();
  }

  db.update(tasks)
    .set({
      title: typeof body.title === "string" ? body.title.trim() || current.title : current.title,
      description: typeof body.description === "string" ? body.description : current.description,
      status: newStatus,
      priority: typeof body.priority === "string" ? body.priority : current.priority,
      assigneeId: body.assigneeId === null ? null : typeof body.assigneeId === "string" ? body.assigneeId : current.assigneeId,
      projectId: typeof body.projectId === "string" ? body.projectId : current.projectId,
      parentId: typeof body.parentId === "string" ? body.parentId : current.parentId,
      startedAt,
      completedAt,
      updatedAt: nowIso(),
    })
    .where(eq(tasks.id, id))
    .run();

  const updated = db.select().from(tasks).where(eq(tasks.id, id)).get();
  if (!updated) return c.json({ error: "task not found" }, 404);

  // Log status change
  if (newStatus !== current.status) {
    logActivity({
      companyId: current.companyId,
      action: `task.status_changed`,
      targetType: "task",
      targetId: id,
      details: { from: current.status, to: newStatus, identifier: current.identifier },
    });
  }

  return c.json(toTask(updated));
});

// Delete task
tasksRoutes.delete("/tasks/:id", (c) => {
  const id = c.req.param("id");
  const current = db.select().from(tasks).where(eq(tasks.id, id)).get();
  if (!current) return c.json({ error: "task not found" }, 404);

  db.delete(tasks).where(eq(tasks.id, id)).run();
  logActivity({
    companyId: current.companyId,
    action: "task.deleted",
    targetType: "task",
    targetId: id,
    details: { title: current.title, identifier: current.identifier },
  });

  return c.body(null, 204);
});

// Checkout task (atomic claim)
tasksRoutes.post("/tasks/:id/checkout", async (c) => {
  const id = c.req.param("id");
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const agentId = typeof body.agentId === "string" ? body.agentId : null;
  if (!agentId) return c.json({ error: "agentId is required" }, 400);

  const current = db.select().from(tasks).where(eq(tasks.id, id)).get();
  if (!current) return c.json({ error: "task not found" }, 404);

  // Only allow checkout from certain statuses
  const allowed = ["backlog", "todo", "blocked"];
  if (!allowed.includes(current.status)) {
    return c.json({ error: `Cannot checkout task in status: ${current.status}` }, 409);
  }

  db.update(tasks)
    .set({
      status: "in_progress",
      assigneeId: agentId,
      startedAt: nowIso(),
      updatedAt: nowIso(),
    })
    .where(eq(tasks.id, id))
    .run();

  const updated = db.select().from(tasks).where(eq(tasks.id, id)).get();

  logActivity({
    companyId: current.companyId,
    agentId,
    action: "task.checked_out",
    targetType: "task",
    targetId: id,
    details: { identifier: current.identifier },
  });

  return c.json(updated ? toTask(updated) : { id });
});

// Release task
tasksRoutes.post("/tasks/:id/release", async (c) => {
  const id = c.req.param("id");
  const current = db.select().from(tasks).where(eq(tasks.id, id)).get();
  if (!current) return c.json({ error: "task not found" }, 404);

  db.update(tasks)
    .set({
      status: "todo",
      assigneeId: null,
      updatedAt: nowIso(),
    })
    .where(eq(tasks.id, id))
    .run();

  const updated = db.select().from(tasks).where(eq(tasks.id, id)).get();
  return c.json(updated ? toTask(updated) : { id });
});

// Get child tasks
tasksRoutes.get("/tasks/:id/children", (c) => {
  const rows = db
    .select()
    .from(tasks)
    .where(eq(tasks.parentId, c.req.param("id")))
    .orderBy(desc(tasks.updatedAt))
    .all()
    .map(toTask);
  return c.json(rows);
});
