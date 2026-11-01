"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type QueueInfo = { id: number; name: string; prefix: string; waiting: number; avgServiceMinutes: number };

/** Customer join page: enter an optional name, take a ticket number. */
export default function JoinPage({ params }: { params: Promise<{ queueId: string }> }) {
  const { queueId } = use(params);
  const router = useRouter();
  const [queue, setQueue] = useState<QueueInfo | null>(null);
  const [missing, setMissing] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/queues")
      .then((r) => r.json())
      .then((list: QueueInfo[]) => {
        const q = list.find((x) => x.id === Number(queueId));
        if (q) setQueue(q);
        else setMissing(true);
      })
      .catch(() => setMissing(true));
  }, [queueId]);

  async function join(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await fetch(`/api/queues/${queueId}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    setBusy(false);
    if (res.ok) router.push(`/t/${data.id}`);
    else setMissing(true);
  }

  if (missing)
    return (
      <main className="card mt-10 text-center">
        <p className="text-slate-500">This queue is not available or is closed.</p>
        <Link href="/" className="btn-slate mt-4">Back to queues</Link>
      </main>
    );
  if (!queue) return <p className="mt-10 text-center text-slate-400">Loading…</p>;

  return (
    <main className="mx-auto max-w-md pt-6">
      <div className="card">
        <h1 className="text-2xl font-bold">{queue.name}</h1>
        <p className="mt-1 text-slate-500">
          {queue.waiting} waiting{queue.waiting === 1 ? "" : "s"}
          {queue.waiting > 0 && (
            <> · about {queue.waiting * queue.avgServiceMinutes} min wait</>
          )}
        </p>
        <form onSubmit={join} className="mt-6 space-y-4">
          <div>
            <label className="label" htmlFor="name">Your name (optional)</label>
            <input
              id="name"
              className="input"
              placeholder="e.g. Ahmad"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
            />
          </div>
          <button type="submit" disabled={busy} className="btn-primary w-full text-xl">
            {busy ? "Taking number…" : "🎟️ Take a number"}
          </button>
        </form>
      </div>
      <p className="mt-4 text-center text-sm text-slate-400">
        Keep this page open — it updates automatically.
      </p>
    </main>
  );
}
