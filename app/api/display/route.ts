import { db } from "@/lib/db";

/** GET /api/display — every counter with its currently serving ticket (public board). */
export async function GET() {
  const counters = await db.counter.findMany({
    orderBy: { id: "asc" },
    include: {
      queue: { select: { name: true } },
      tickets: {
        where: { status: "serving" },
        orderBy: { calledAt: "desc" },
        take: 1,
        select: { number: true, calledAt: true },
      },
    },
  });
  return Response.json(
    counters.map((c) => ({
      id: c.id,
      name: c.name,
      queueName: c.queue.name,
      serving: c.tickets[0]?.number ?? null,
      calledAt: c.tickets[0]?.calledAt ?? null,
    }))
  );
}
