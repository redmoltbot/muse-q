import { db } from "@/lib/db";
import { getRoles, requireStaff } from "@/lib/auth";

/** POST /api/staff/recall { counterId } — re-announce the currently serving ticket. */
export async function POST(req: Request) {
  const denied = requireStaff(await getRoles());
  if (denied) return denied;

  const { counterId } = await req.json().catch(() => ({}));
  const serving = await db.ticket.findFirst({
    where: { counterId: Number(counterId), status: "serving" },
    orderBy: { calledAt: "desc" },
  });
  if (!serving) return Response.json({ error: "Nothing is being served" }, { status: 404 });
  await db.ticket.update({ where: { id: serving.id }, data: { calledAt: new Date() } });
  return Response.json({ ok: true, number: serving.number });
}
