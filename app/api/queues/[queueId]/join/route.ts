import { db } from "@/lib/db";

/** POST /api/queues/:queueId/join { name? } — issue a new ticket number. */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ queueId: string }> }
) {
  const { queueId } = await params;
  const qid = Number(queueId);
  const body = await req.json().catch(() => ({}));
  const customerName = typeof body.name === "string" ? body.name.trim().slice(0, 60) || null : null;

  // Allocate the next sequence number atomically inside a transaction.
  const ticket = await db.$transaction(async (tx) => {
    const queue = await tx.queue.findUnique({ where: { id: qid } });
    if (!queue || !queue.isOpen) return null;
    const seq = queue.nextSeq;
    const created = await tx.ticket.create({
      data: {
        queueId: qid,
        seq,
        number: `${queue.prefix}${String(seq).padStart(3, "0")}`,
        customerName,
      },
    });
    await tx.queue.update({ where: { id: qid }, data: { nextSeq: seq + 1 } });
    return created;
  });

  if (!ticket) return Response.json({ error: "Queue not found or closed" }, { status: 404 });
  return Response.json({ id: ticket.id, number: ticket.number });
}
