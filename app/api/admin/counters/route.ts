import { db } from "@/lib/db";
import { getRoles, requireAdmin } from "@/lib/auth";

/** POST /api/admin/counters { queueId, name } — add a counter to a queue. */
export async function POST(req: Request) {
  const denied = requireAdmin(await getRoles());
  if (denied) return denied;

  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? "").trim();
  const queueId = Number(body.queueId);
  if (!name || !queueId) return Response.json({ error: "queueId and name are required" }, { status: 400 });
  if (!(await db.queue.findUnique({ where: { id: queueId } })))
    return Response.json({ error: "Queue not found" }, { status: 404 });

  const counter = await db.counter.create({ data: { queueId, name: name.slice(0, 60) } });
  return Response.json(counter, { status: 201 });
}
