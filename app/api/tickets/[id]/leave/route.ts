import { db } from "@/lib/db";

/** POST /api/tickets/:id/leave — customer gives up their ticket. */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ticket = await db.ticket.findUnique({ where: { id: Number(id) } });
  if (!ticket) return Response.json({ error: "Ticket not found" }, { status: 404 });
  if (ticket.status !== "waiting")
    return Response.json({ error: "Ticket is no longer waiting" }, { status: 409 });
  await db.ticket.update({ where: { id: ticket.id }, data: { status: "no_show" } });
  return Response.json({ ok: true });
}
