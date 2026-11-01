import { db } from "@/lib/db";
import { getRoles, requireAdmin } from "@/lib/auth";

/** DELETE /api/admin/counters/:id — remove a counter. */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = requireAdmin(await getRoles());
  if (denied) return denied;

  const { id } = await params;
  await db.counter.delete({ where: { id: Number(id) } });
  return Response.json({ ok: true });
}
