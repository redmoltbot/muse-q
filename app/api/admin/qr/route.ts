import QRCode from "qrcode";
import { db } from "@/lib/db";
import { getRoles, requireAdmin } from "@/lib/auth";

/** GET /api/admin/qr?queueId= — QR code (data URL) linking to the queue's join page. */
export async function GET(req: Request) {
  const denied = requireAdmin(await getRoles());
  if (denied) return denied;

  const { searchParams } = new URL(req.url);
  const queueId = Number(searchParams.get("queueId"));
  const queue = await db.queue.findUnique({ where: { id: queueId } });
  if (!queue) return Response.json({ error: "Queue not found" }, { status: 404 });

  // Prefer an explicit public base URL; otherwise use the request's own host.
  const fromEnv = (process.env.NEXT_PUBLIC_BASE_URL || "").replace(/\/$/, "");
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
  const proto = req.headers.get("x-forwarded-proto") || "http";
  const base = fromEnv || `${proto}://${host}`;
  const joinUrl = `${base}/q/${queue.id}`;

  const dataUrl = await QRCode.toDataURL(joinUrl, { width: 400, margin: 1 });
  return Response.json({ url: joinUrl, dataUrl });
}
