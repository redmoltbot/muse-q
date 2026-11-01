# Muse-Q 🎟️

A generic e-queue ticket (virtual take-a-number) web app. One business per deployment.

- **Customers** open the site, pick an open queue, take a ticket number, and watch their
  position + estimated wait update live — no app install, no paper ticket.
- **Staff** (`/staff`, staff PIN) pick a counter and call next / recall / mark served / no-show.
- **Public display** (`/display`) shows a big "NOW SERVING" board per counter for a TV screen.
- **Admin** (`/admin`, admin PIN) creates queues, opens/closes them, manages counters,
  shows a QR code linking to the join page, and runs the end-of-day reset.

Stack: Next.js (App Router) + TypeScript + Tailwind CSS + Prisma. SQLite for local dev,
Postgres for production. No WhatsApp, no payments, no multi-branch — kept simple on purpose.

## Quick start

```bash
npm install
cp .env.example .env   # then set ADMIN_PIN / STAFF_PIN
npx prisma migrate dev --name init   # creates prisma/dev.db
node prisma/seed.js                  # demo queue + hashed PINs (or: npx prisma db seed)
npm run dev
```

Open http://localhost:3000

- Default PINs (dev only): admin `1234`, staff `0000` — change them in `.env` **before**
  running the seed on any real deployment.
- The seed creates a "Demo Queue" (prefix `Q`) with "Counter 1".

## Useful scripts

| Command              | What it does                              |
| -------------------- | ----------------------------------------- |
| `npm run dev`        | Dev server with hot reload                |
| `npm run build`      | Prisma generate + production build        |
| `npm start`          | Serve the production build                |
| `npx prisma studio`  | Visual DB browser                         |
| `node prisma/seed.js`| Re-run seed (safe: never overwrites PINs) |

## Switching to Postgres (production)

The Prisma schema is portable — no model changes needed:

1. In `prisma/schema.prisma`, change the datasource to:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. Set `DATABASE_URL` to your Postgres connection string
   (e.g. a free [Neon](https://neon.tech) database).
3. Run `npx prisma migrate deploy` (or `migrate dev` once, then commit the migration).

## Deploying on Vercel

1. Push this folder to a GitHub repo.
2. Import it in Vercel. Set environment variables:
   - `DATABASE_URL` — your Postgres connection string
   - `ADMIN_PIN`, `STAFF_PIN` — strong PINs
   - `NEXT_PUBLIC_BASE_URL` — e.g. `https://muse-q.vercel.app` (used for QR codes)
3. Vercel runs `npm run build` automatically (which runs `prisma generate`).
4. After the first deploy, run the seed once to create the demo queue and store the
   hashed PINs. Easiest: `npx prisma db seed` locally against the production
   `DATABASE_URL`, or run it from Vercel's CLI.
5. Each business gets its own Vercel project (one business per deployment).

## Troubleshooting

- **Prisma engine download stalls/fails during `npm install`.** The `@prisma/engines`
  postinstall downloads binary engines from `binaries.prisma.sh`; on flaky networks
  this can abort. Fix: `npm install --ignore-scripts`, then run
  `npx prisma generate` / `npx prisma migrate deploy` — they retry the download
  themselves. If the download keeps aborting, fetch the two files manually with
  `curl --retry` from
  `https://binaries.prisma.sh/all_commits/<commit>/debian-openssl-3.0.x/` and place
  the unzipped `schema-engine-*` and `libquery_engine-*.so.node` into
  `node_modules/@prisma/engines/` (plus a copy of the `.so.node` into
  `node_modules/prisma/`), then re-run the prisma command.

## How it works

- Ticket numbers are allocated per queue from `Queue.nextSeq` inside a DB transaction,
  so two customers joining at the same moment can't get the same number.
- Pages showing live state (ticket, staff console, display board) poll their API
  endpoint every 5 seconds — simple and robust, no websocket infra.
- PINs are verified with scrypt hashes stored in the `Setting` table; sessions are
  httpOnly cookies (`mq_admin` / `mq_staff`), 12-hour expiry. Admin implies staff.

## Project layout

```
prisma/            schema + seed script
lib/               db client, PIN hashing, cookie auth helpers
components/        PinGate (staff/admin login)
app/
  page.tsx         customer home — open queues
  q/[queueId]/     join form
  t/[id]/          live ticket view
  staff/           staff console
  display/         now-serving board
  admin/           admin console
  api/             all data endpoints (queues, tickets, staff, display, admin, auth)
```
