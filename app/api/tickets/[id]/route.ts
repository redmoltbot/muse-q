import { db } from "@/lib/db";

/** GET /api/tickets/:id — ticket status plus live queue position info. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ticket = await db.ticket.findUnique({
    where: { id: Number(id) },
    include: { queue: true, counter: true },
  });
  if (!ticket) return Response.json({ error: "Ticket not found" }, { status: 404 });

  // People ahead = waiting tickets in the same queue with a lower sequence number.
  const ahead =
    ticket.status === "waiting"
      ? await db.ticket.count({
          where: { queueId: ticket.queueId, status: "waiting", seq: { lt: ticket.seq } },
        })
      : 0;

  return Response.json({
    id: ticket.id,
    number: ticket.number,
    customerName: ticket.customerName,
    status: ticket.status,
    queueName: ticket.queue.name,
    counterName: ticket.counter?.name ?? null,
    position: ahead + 1,
    ahead,
    etaMinutes: ahead * ticket.queue.avgServiceMinutes,
    calledAt: ticket.calledAt,
  });
}
