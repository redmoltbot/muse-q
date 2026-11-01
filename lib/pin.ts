import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { db } from "./db";

const ADMIN_KEY = "adminPinHash";
const STAFF_KEY = "staffPinHash";

function scryptP(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) =>
    scryptCb(password, salt, 64, (err, key) => (err ? reject(err) : resolve(key as Buffer)))
  );
}

/** Hash a PIN with a random salt: "scrypt$<salt>$<hash>". */
export async function hashPin(pin: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const key = await scryptP(pin, salt);
  return `scrypt$${salt}$${key.toString("hex")}`;
}

/** Constant-time comparison of a PIN against a stored hash. */
export async function verifyPin(pin: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const [, salt, hashHex] = parts;
  const key = await scryptP(pin, salt);
  const expected = Buffer.from(hashHex, "hex");
  return key.length === expected.length && timingSafeEqual(key, expected);
}

/**
 * Make sure hashed PINs exist in the Setting table, seeding from
 * ADMIN_PIN / STAFF_PIN env vars on first run. Safe to call on every login.
 */
export async function ensurePinSeeded(): Promise<void> {
  const defaults: Array<[string, string | undefined]> = [
    [ADMIN_KEY, process.env.ADMIN_PIN || "1234"],
    [STAFF_KEY, process.env.STAFF_PIN || "0000"],
  ];
  for (const [key, pin] of defaults) {
    const existing = await db.setting.findUnique({ where: { key } });
    if (!existing) {
      await db.setting.create({ data: { key, value: await hashPin(pin!) } });
    }
  }
}

export async function checkPin(role: "admin" | "staff", pin: string): Promise<boolean> {
  await ensurePinSeeded();
  const row = await db.setting.findUnique({ where: { key: role === "admin" ? ADMIN_KEY : STAFF_KEY } });
  if (!row) return false;
  return verifyPin(pin, row.value);
}
