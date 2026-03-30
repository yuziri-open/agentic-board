import { desc, eq } from "drizzle-orm";
import type { Activity } from "@agentic-board/shared";
import { db, generateId, nowIso, toActivity } from "../db/index.js";
import { activities } from "../db/schema.js";

type ActivityInput = {
  companyId: string;
  agentId?: string | null;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  details?: Record<string, unknown> | null;
  createdAt?: string;
};

type ActivityListener = {
  companyId?: string;
  onActivity: (activity: Activity) => void;
};

const listeners = new Map<string, ActivityListener>();

export function listActivity(companyId: string, limit = 50): Activity[] {
  return db
    .select()
    .from(activities)
    .where(eq(activities.companyId, companyId))
    .orderBy(desc(activities.createdAt))
    .limit(limit)
    .all()
    .map(toActivity);
}

export function logActivity(input: ActivityInput): Activity {
  const row = {
    id: generateId(),
    companyId: input.companyId,
    agentId: input.agentId ?? null,
    action: input.action,
    targetType: input.targetType ?? null,
    targetId: input.targetId ?? null,
    details: input.details ? JSON.stringify(input.details) : null,
    createdAt: input.createdAt ?? nowIso()
  };

  db.insert(activities).values(row).run();
  const activity = toActivity(row);

  for (const listener of listeners.values()) {
    if (!listener.companyId || listener.companyId === activity.companyId) {
      listener.onActivity(activity);
    }
  }

  return activity;
}

export function subscribeToActivity(listener: ActivityListener): () => void {
  const id = generateId();
  listeners.set(id, listener);
  return () => {
    listeners.delete(id);
  };
}
