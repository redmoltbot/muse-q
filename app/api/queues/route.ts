import { db } from "@/lib/db";

/** GET /api/queues — list open queues with current waiting counts. */
export async function GET() {
  const queues = await db.queue.findMany({
    where: { isOpen: true },
    orderBy: { id: "asc" },
    include: { _count: { select: { tickets: { where: { status: "waiting" } } } } },
  });
  return Response.json(
    queues.map((q) => ({
      id: q.id,
      name: q.name,
      prefix: q.prefix,
      avgServiceMinutes: q.avgServiceMinutes,
      waiting: q._count.tickets,
    }))
  );
}
