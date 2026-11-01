import { db } from "@/lib/db";
import { getRoles, requireStaff } from "@/lib/auth";

/** GET /api/staff/state?counterId= — counters list + waiting list + current serving ticket. */
export async function GET(req: Request) {
  const denied = requireStaff(await getRoles());
  if (denied) return denied;

  const { searchParams } = new URL(req.url);
  const counterId = Number(searchParams.get("counterId") || 0);

  const counters = await db.counter.findMany({
    orderBy: { id: "asc" },
    include: { queue: { select: { id: true, name: true } } },
  });

  const counter = counterId ? await db.counter.findUnique({ where: { id: counterId } }) : null;

  let waiting: unknown[] = [];
  let serving: unknown = null;
  if (counter) {
    waiting = await db.ticket.findMany({
      where: { queueId: counter.queueId, status: "waiting" },
      orderBy: { seq: "asc" },
      take: 50,
      select: { id: true, number: true, customerName: true, createdAt: true },
    });
    serving = await db.ticket.findFirst({
      where: { counterId: counter.id, status: "serving" },
      orderBy: { calledAt: "desc" },
      select: { id: true, number: true, customerName: true, calledAt: true },
    });
  }

  return Response.json({ counters, selectedCounterId: counter?.id ?? null, waiting, serving });
}
