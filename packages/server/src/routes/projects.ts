import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { db, generateId, nowIso, toProject } from "../db/index.js";
import { projects, tasks } from "../db/schema.js";
import { logActivity } from "../services/activity.js";

export const projectsRoutes = new Hono();

projectsRoutes.get("/companies/:companyId/projects", (c) => {
  const rows = db
    .select()
    .from(projects)
    .where(eq(projects.companyId, c.req.param("companyId")))
    .orderBy(projects.name)
    .all()
    .map(toProject);

  return c.json(rows);
});

projectsRoutes.post("/companies/:companyId/projects", async (c) => {
  const companyId = c.req.param("companyId");
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const name = typeof body.name === "string" ? body.name.trim() : "";

  if (!name) {
    return c.json({ error: "name is required" }, 400);
  }

  const createdAt = nowIso();
  const project = {
    id: generateId(),
    companyId,
    name,
    description: typeof body.description === "string" ? body.description : null,
    status: typeof body.status === "string" ? body.status : "active",
    workspacePath: typeof body.workspacePath === "string" ? body.workspacePath : null,
    createdAt,
    updatedAt: createdAt
  };

  db.insert(projects).values(project).run();
  logActivity({
    companyId,
    action: "project.created",
    targetType: "project",
    targetId: project.id,
    details: { name: project.name }
  });

  return c.json(toProject(project), 201);
});

projectsRoutes.get("/projects/:id", (c) => {
  const row = db.select().from(projects).where(eq(projects.id, c.req.param("id"))).get();
  return row ? c.json(toProject(row)) : c.json({ error: "project not found" }, 404);
});

projectsRoutes.patch("/projects/:id", async (c) => {
  const id = c.req.param("id");
  const current = db.select().from(projects).where(eq(projects.id, id)).get();
  if (!current) {
    return c.json({ error: "project not found" }, 404);
  }

  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  db.update(projects)
    .set({
      name: typeof body.name === "string" ? body.name.trim() || current.name : current.name,
      description: typeof body.description === "string" ? body.description : current.description,
      status: typeof body.status === "string" ? body.status : current.status,
      workspacePath: typeof body.workspacePath === "string" ? body.workspacePath : current.workspacePath,
      updatedAt: nowIso()
    })
    .where(eq(projects.id, id))
    .run();

  const updated = db.select().from(projects).where(eq(projects.id, id)).get();
  if (!updated) {
    return c.json({ error: "project not found" }, 404);
  }

  logActivity({
    companyId: updated.companyId,
    action: "project.updated",
    targetType: "project",
    targetId: updated.id
  });

  return c.json(toProject(updated));
});

projectsRoutes.delete("/projects/:id", (c) => {
  const id = c.req.param("id");
  const current = db.select().from(projects).where(eq(projects.id, id)).get();
  if (!current) {
    return c.json({ error: "project not found" }, 404);
  }

  db.update(tasks).set({ projectId: null, updatedAt: nowIso() }).where(eq(tasks.projectId, id)).run();
  db.delete(projects).where(eq(projects.id, id)).run();

  logActivity({
    companyId: current.companyId,
    action: "project.deleted",
    targetType: "project",
    targetId: current.id,
    details: { name: current.name }
  });

  return c.body(null, 204);
});
