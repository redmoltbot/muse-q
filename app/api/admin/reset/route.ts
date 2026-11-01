import { db } from "@/lib/db";
import { getRoles, requireAdmin } from "@/lib/auth";

/** POST /api/admin/reset — end-of-day reset: clear all tickets, restart numbering at 1. */
export async function POST() {
  const denied = requireAdmin(await getRoles());
  if (denied) return denied;

  await db.$transaction([
    db.ticket.deleteMany({}),
    db.queue.updateMany({ data: { nextSeq: 1 } }),
  ]);
  return Response.json({ ok: true });
}
