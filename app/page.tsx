"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Queue = { id: number; name: string; prefix: string; waiting: number };

/** Customer home: list open queues to join. */
export default function Home() {
  const [queues, setQueues] = useState<Queue[] | null>(null);

  useEffect(() => {
    fetch("/api/queues")
      .then((r) => r.json())
      .then(setQueues)
      .catch(() => setQueues([]));
  }, []);

  return (
    <main className="space-y-6">
      <header className="text-center">
        <h1 className="text-4xl font-extrabold tracking-tight">🎟️ Muse-Q</h1>
        <p className="mt-2 text-slate-500">Take a queue number — no app, no paper ticket.</p>
      </header>

      {queues === null && <p className="text-center text-slate-400">Loading queues…</p>}

      {queues !== null && queues.length === 0 && (
        <div className="card text-center text-slate-500">
          No queues are open right now. Please check back later.
        </div>
      )}

      <div className="space-y-3">
        {queues?.map((q) => (
          <div key={q.id} className="card flex items-center justify-between gap-4">
            <div>
              <div className="text-xl font-bold">{q.name}</div>
              <div className="text-sm text-slate-500">
                {q.waiting} waiting{q.waiting === 1 ? "" : "s"}
              </div>
            </div>
            <Link href={`/q/${q.id}`} className="btn-primary shrink-0">
              Join queue
            </Link>
          </div>
        ))}
      </div>

      <footer className="pt-8 text-center text-xs text-slate-400">
        <Link href="/staff" className="underline">Staff</Link>
        {" · "}
        <Link href="/display" className="underline">Display board</Link>
        {" · "}
        <Link href="/admin" className="underline">Admin</Link>
      </footer>
    </main>
  );
}
