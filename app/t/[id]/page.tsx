"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";

type TicketInfo = {
  id: number;
  number: string;
  customerName: string | null;
  status: string;
  queueName: string;
  counterName: string | null;
  position: number;
  ahead: number;
  etaMinutes: number;
  calledAt: string | null;
};

/** Customer ticket page: live number, position, ETA. Refreshes every 5s. */
export default function TicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [t, setT] = useState<TicketInfo | null>(null);
  const [gone, setGone] = useState(false);

  const load = useCallback(() => {
    fetch(`/api/tickets/${id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setT)
      .catch(() => setGone(true));
  }, [id]);

  useEffect(() => {
    load();
    const timer = setInterval(load, 5000);
    return () => clearInterval(timer);
  }, [load]);

  async function leave() {
    if (!confirm("Leave the queue? Your number will be cancelled.")) return;
    await fetch(`/api/tickets/${id}/leave`, { method: "POST" });
    load();
  }

  if (gone)
    return (
      <main className="card mt-10 text-center text-slate-500">
        Ticket not found. <Link href="/" className="underline">Back to queues</Link>
      </main>
    );
  if (!t) return <p className="mt-10 text-center text-slate-400">Loading your ticket…</p>;

  return (
    <main className="mx-auto max-w-md pt-6">
      <div className="card text-center">
        <p className="text-sm uppercase tracking-widest text-slate-400">{t.queueName}</p>
        <p className="mt-2 text-7xl font-extrabold tracking-tight">{t.number}</p>

        {t.status === "waiting" && (
          <div className="mt-6 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl bg-slate-100 p-3">
              <div className="text-3xl font-bold">{t.position}</div>
              <div className="text-xs text-slate-500">your position</div>
            </div>
            <div className="rounded-xl bg-slate-100 p-3">
              <div className="text-3xl font-bold">{t.ahead}</div>
              <div className="text-xs text-slate-500">ahead of you</div>
            </div>
            <div className="rounded-xl bg-slate-100 p-3">
              <div className="text-3xl font-bold">~{t.etaMinutes}</div>
              <div className="text-xs text-slate-500">min wait</div>
            </div>
          </div>
        )}

        {t.status === "serving" && (
          <div className="mt-6 rounded-xl bg-emerald-100 p-4">
            <p className="text-2xl font-bold text-emerald-800">It's your turn! 🎉</p>
            <p className="text-emerald-700">
              Please proceed{t.counterName ? ` to ${t.counterName}` : ""}.
            </p>
          </div>
        )}

        {t.status === "done" && (
          <p className="mt-6 rounded-xl bg-slate-100 p-4 text-lg text-slate-600">
            ✅ Served — thank you!
          </p>
        )}

        {t.status === "no_show" && (
          <p className="mt-6 rounded-xl bg-amber-100 p-4 text-lg text-amber-800">
            Your number was skipped or cancelled.
          </p>
        )}

        {t.status === "waiting" && (
          <button onClick={leave} className="btn-red mt-6 w-full">
            Leave queue
          </button>
        )}
      </div>
      <p className="mt-4 text-center text-xs text-slate-400">Auto-refreshes every 5 seconds.</p>
    </main>
  );
}
