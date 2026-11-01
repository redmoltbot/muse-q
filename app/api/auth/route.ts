import { checkPin } from "@/lib/pin";
import { getRoles, ADMIN_COOKIE, STAFF_COOKIE } from "@/lib/auth";

/** GET /api/auth — which roles this browser currently holds. */
export async function GET() {
  return Response.json(await getRoles());
}

/** POST /api/auth { role: "admin"|"staff", pin } — verify PIN, set httpOnly cookie. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const role = body.role === "admin" ? "admin" : "staff";
  const pin = String(body.pin ?? "");
  if (!(await checkPin(role, pin))) {
    return Response.json({ error: "Wrong PIN" }, { status: 401 });
  }
  const res = Response.json({ ok: true, role });
  const cookie = role === "admin" ? ADMIN_COOKIE : STAFF_COOKIE;
  res.headers.append(
    "Set-Cookie",
    `${cookie}=1; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 12}`
  );
  return res;
}

/** DELETE /api/auth — log out (clear both role cookies). */
export async function DELETE() {
  const res = Response.json({ ok: true });
  for (const c of [ADMIN_COOKIE, STAFF_COOKIE]) {
    res.headers.append("Set-Cookie", `${c}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
  }
  return res;
}
