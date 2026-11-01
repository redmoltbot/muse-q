import { db } from "@/lib/db";
import { getRoles, requireStaff } from "@/lib/auth";

/** POST /api/staff/call-next { counterId } — serve the oldest waiting ticket at this counter.
 *  Any ticket currently serving at this counter is auto-marked done. */
export async function POST(req: Request) {
  const denied = requireStaff(await getRoles());
  if (denied) return denied;

  const { counterId } = await req.json().catch(() => ({}));
  const counter = await db.counter.findUnique({ where: { id: Number(counterId) } });
  if (!counter) return Response.json({ error: "Counter not found" }, { status: 404 });

  const result = await db.$transaction(async (tx) => {
    await tx.ticket.updateMany({
      where: { counterId: counter.id, status: "serving" },
      data: { status: "done" },
    });
    const next = await tx.ticket.findFirst({
      where: { queueId: counter.queueId, status: "waiting" },
      orderBy: { seq: "asc" },
    });
    if (!next) return null;
    return tx.ticket.update({
      where: { id: next.id },
      data: { status: "serving", counterId: counter.id, calledAt: new Date() },
      select: { id: true, number: true, customerName: true },
    });
  });

  if (!result) return Response.json({ error: "Nobody is waiting" }, { status: 404 });
  return Response.json(result);
}
