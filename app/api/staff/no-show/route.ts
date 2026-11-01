import { db } from "@/lib/db";
import { getRoles, requireStaff } from "@/lib/auth";

/** POST /api/staff/no-show { ticketId } — mark a waiting/serving ticket as no-show. */
export async function POST(req: Request) {
  const denied = requireStaff(await getRoles());
  if (denied) return denied;

  const { ticketId } = await req.json().catch(() => ({}));
  const ticket = await db.ticket.findUnique({ where: { id: Number(ticketId) } });
  if (!ticket || (ticket.status !== "waiting" && ticket.status !== "serving"))
    return Response.json({ error: "Ticket cannot be marked no-show" }, { status: 409 });
  await db.ticket.update({ where: { id: ticket.id }, data: { status: "no_show" } });
  return Response.json({ ok: true });
}
