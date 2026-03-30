import { Hono } from "hono";
import { listActivity, subscribeToActivity } from "../services/activity.js";

export const activityRoutes = new Hono();

activityRoutes.get("/companies/:companyId/activity", (c) => {
  const limit = Math.min(Number(c.req.query("limit") ?? "50") || 50, 200);
  return c.json(listActivity(c.req.param("companyId"), limit));
});

activityRoutes.get("/activity/stream", (c) => {
  const companyId = c.req.query("companyId") ?? undefined;
  const encoder = new TextEncoder();
  let unsubscribe: () => void = () => {};
  let heartbeat: NodeJS.Timeout | undefined;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (event: string, payload: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`));
      };

      unsubscribe = subscribeToActivity({
        ...(companyId ? { companyId } : {}),
        onActivity: (activity) => send("activity", activity)
      });

      heartbeat = setInterval(() => {
        send("heartbeat", { ts: new Date().toISOString() });
      }, 15000);

      c.req.raw.signal.addEventListener(
        "abort",
        () => {
          if (heartbeat) {
            clearInterval(heartbeat);
          }
          unsubscribe();
          controller.close();
        },
        { once: true }
      );

      send("ready", { companyId, connectedAt: new Date().toISOString() });
    },
    cancel() {
      if (heartbeat) {
        clearInterval(heartbeat);
      }
      unsubscribe();
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive"
    }
  });
});
