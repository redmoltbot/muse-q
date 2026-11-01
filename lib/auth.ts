import { cookies } from "next/headers";

export const ADMIN_COOKIE = "mq_admin";
export const STAFF_COOKIE = "mq_staff";

/** Roles granted by the request's cookies. Admin implies staff access. */
export async function getRoles(): Promise<{ admin: boolean; staff: boolean }> {
  const jar = await cookies();
  const admin = jar.get(ADMIN_COOKIE)?.value === "1";
  const staff = admin || jar.get(STAFF_COOKIE)?.value === "1";
  return { admin, staff };
}

export function requireStaff(roles: { staff: boolean }): Response | null {
  return roles.staff ? null : Response.json({ error: "Staff PIN required" }, { status: 401 });
}

export function requireAdmin(roles: { admin: boolean }): Response | null {
  return roles.admin ? null : Response.json({ error: "Admin PIN required" }, { status: 401 });
}
