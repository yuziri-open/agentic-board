import { desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { db, toRun } from "../db/index.js";
import { runs } from "../db/schema.js";

export const runsRoutes = new Hono();

runsRoutes.get("/runs/:id", (c) => {
  const row = db.select().from(runs).where(eq(runs.id, c.req.param("id"))).get();
  return row ? c.json(toRun(row)) : c.json({ error: "run not found" }, 404);
});

runsRoutes.get("/agents/:agentId/runs", (c) => {
  const rows = db
    .select()
    .from(runs)
    .where(eq(runs.agentId, c.req.param("agentId")))
    .orderBy(desc(runs.startedAt))
    .all()
    .map(toRun);

  return c.json(rows);
});
