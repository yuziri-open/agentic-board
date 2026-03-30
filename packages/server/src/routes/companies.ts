import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { db, generateId, nowIso, toCompany } from "../db/index.js";
import { companies } from "../db/schema.js";
import { logActivity } from "../services/activity.js";

export const companiesRoutes = new Hono();

companiesRoutes.get("/companies", (c) => {
  const rows = db.select().from(companies).orderBy(companies.name).all().map(toCompany);
  return c.json(rows);
});

companiesRoutes.post("/companies", async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const name = typeof body.name === "string" ? body.name.trim() : "";

  if (!name) {
    return c.json({ error: "name is required" }, 400);
  }

  const createdAt = nowIso();
  const company = {
    id: generateId(),
    name,
    description: typeof body.description === "string" ? body.description : null,
    createdAt,
    updatedAt: createdAt
  };

  db.insert(companies).values(company).run();
  logActivity({
    companyId: company.id,
    action: "company.created",
    targetType: "company",
    targetId: company.id,
    details: { name: company.name }
  });

  return c.json(toCompany(company), 201);
});

companiesRoutes.get("/companies/:id", (c) => {
  const row = db.select().from(companies).where(eq(companies.id, c.req.param("id"))).get();
  return row ? c.json(toCompany(row)) : c.json({ error: "company not found" }, 404);
});

companiesRoutes.patch("/companies/:id", async (c) => {
  const id = c.req.param("id");
  const current = db.select().from(companies).where(eq(companies.id, id)).get();
  if (!current) {
    return c.json({ error: "company not found" }, 404);
  }

  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  db.update(companies)
    .set({
      name: typeof body.name === "string" ? body.name.trim() || current.name : current.name,
      description: typeof body.description === "string" ? body.description : current.description,
      updatedAt: nowIso()
    })
    .where(eq(companies.id, id))
    .run();

  const updated = db.select().from(companies).where(eq(companies.id, id)).get();
  if (!updated) {
    return c.json({ error: "company not found" }, 404);
  }

  logActivity({
    companyId: id,
    action: "company.updated",
    targetType: "company",
    targetId: id
  });

  return c.json(toCompany(updated));
});

companiesRoutes.delete("/companies/:id", (c) => {
  const id = c.req.param("id");
  const current = db.select().from(companies).where(eq(companies.id, id)).get();
  if (!current) {
    return c.json({ error: "company not found" }, 404);
  }

  db.delete(companies).where(eq(companies.id, id)).run();
  return c.body(null, 204);
});
