import { db } from "@/lib/db";
import { getRoles, requireStaff } from "@/lib/auth";

/** POST /api/staff/complete { ticketId } — mark a serving ticket as done. */
export async function POST(req: Request) {
  const denied = requireStaff(await getRoles());
  if (denied) return denied;

  const { ticketId } = await req.json().catch(() => ({}));
  const ticket = await db.ticket.findUnique({ where: { id: Number(ticketId) } });
  if (!ticket || ticket.status !== "serving")
    return Response.json({ error: "Ticket is not being served" }, { status: 409 });
  await db.ticket.update({ where: { id: ticket.id }, data: { status: "done" } });
  return Response.json({ ok: true });
}
