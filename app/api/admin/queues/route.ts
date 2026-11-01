import { db } from "@/lib/db";
import { getRoles, requireAdmin } from "@/lib/auth";

/** GET /api/admin/queues — all queues with counters and live counts. */
export async function GET() {
  const denied = requireAdmin(await getRoles());
  if (denied) return denied;

  const queues = await db.queue.findMany({
    orderBy: { id: "asc" },
    include: {
      counters: { orderBy: { id: "asc" } },
      _count: {
        select: {
          tickets: { where: { status: { in: ["waiting", "serving"] } } },
        },
      },
    },
  });
  return Response.json(
    queues.map((q) => ({
      id: q.id,
      name: q.name,
      prefix: q.prefix,
      avgServiceMinutes: q.avgServiceMinutes,
      isOpen: q.isOpen,
      counters: q.counters,
      active: q._count.tickets,
    }))
  );
}

/** POST /api/admin/queues { name, prefix?, avgServiceMinutes? } — create a queue. */
export async function POST(req: Request) {
  const denied = requireAdmin(await getRoles());
  if (denied) return denied;

  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? "").trim();
  if (!name) return Response.json({ error: "Name is required" }, { status: 400 });
  const prefix = String(body.prefix ?? "A").trim().toUpperCase().slice(0, 3) || "A";
  const avg = Math.max(1, Math.min(120, Number(body.avgServiceMinutes) || 5));

  const queue = await db.queue.create({
    data: { name: name.slice(0, 80), prefix, avgServiceMinutes: avg },
  });
  return Response.json(queue, { status: 201 });
}
