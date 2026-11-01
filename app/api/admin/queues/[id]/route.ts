import { db } from "@/lib/db";
import { getRoles, requireAdmin } from "@/lib/auth";

async function guard() {
  const denied = requireAdmin(await getRoles());
  return denied;
}

/** PATCH /api/admin/queues/:id — edit name/prefix/avg time, or open/close. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await guard();
  if (denied) return denied;

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim().slice(0, 80);
  if (typeof body.prefix === "string" && body.prefix.trim())
    data.prefix = body.prefix.trim().toUpperCase().slice(0, 3);
  if (body.avgServiceMinutes !== undefined)
    data.avgServiceMinutes = Math.max(1, Math.min(120, Number(body.avgServiceMinutes) || 5));
  if (typeof body.isOpen === "boolean") data.isOpen = body.isOpen;

  const queue = await db.queue.update({ where: { id: Number(id) }, data });
  return Response.json(queue);
}

/** DELETE /api/admin/queues/:id — delete a queue and all its tickets/counters. */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await guard();
  if (denied) return denied;

  const { id } = await params;
  await db.queue.delete({ where: { id: Number(id) } });
  return Response.json({ ok: true });
}
