/* Seed script: creates a demo queue + counter and stores hashed default PINs.
 * Run with: node prisma/seed.js   (or `npx prisma db seed`)
 * PINs come from ADMIN_PIN / STAFF_PIN env vars (defaults 1234 / 0000). */
const { PrismaClient } = require("@prisma/client");
const { randomBytes, scrypt } = require("node:crypto");

const db = new PrismaClient();

function hashPin(pin) {
  return new Promise((resolve, reject) => {
    const salt = randomBytes(16).toString("hex");
    scrypt(pin, salt, 64, (err, key) => {
      if (err) return reject(err);
      resolve(`scrypt$${salt}$${key.toString("hex")}`);
    });
  });
}

async function main() {
  // Seed hashed PINs (only if missing, so re-seeding never overwrites).
  for (const [key, pin] of [
    ["adminPinHash", process.env.ADMIN_PIN || "1234"],
    ["staffPinHash", process.env.STAFF_PIN || "0000"],
  ]) {
    if (!(await db.setting.findUnique({ where: { key } }))) {
      await db.setting.create({ data: { key, value: await hashPin(pin) } });
      console.log(`Seeded ${key}`);
    }
  }

  // Demo queue + counter (only if no queues exist yet).
  if ((await db.queue.count()) === 0) {
    const queue = await db.queue.create({
      data: {
        name: "Demo Queue",
        prefix: "Q",
        avgServiceMinutes: 5,
        isOpen: true,
        counters: { create: [{ name: "Counter 1" }] },
      },
      include: { counters: true },
    });
    console.log(`Created queue "${queue.name}" with ${queue.counters[0].name}`);
  } else {
    console.log("Queues already exist, skipping demo queue.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
