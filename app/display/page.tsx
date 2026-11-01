"use client";

import { useCallback, useEffect, useState } from "react";

type Row = { id: number; name: string; queueName: string; serving: string | null; calledAt: string | null };

/** Public "now serving" board. Auto-refreshes every 5s. Big text for TV screens. */
export default function DisplayPage() {
  const [rows, setRows] = useState<Row[] | null>(null);

  const load = useCallback(() => {
    fetch("/api/display").then((r) => r.json()).then(setRows).catch(() => {});
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 5000);
    return () => clearInterval(timer);
  }, [load]);

  return (
    <main className="mx-auto max-w-4xl">
      <h1 className="mb-6 text-center text-4xl font-extrabold tracking-tight">🔔 NOW SERVING</h1>
      {rows === null && <p className="text-center text-slate-400">Loading…</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        {rows?.map((r) => (
          <div key={r.id} className="card text-center !p-8">
            <p className="text-lg font-semibold text-slate-500">
              {r.name} <span className="text-slate-300">·</span> {r.queueName}
            </p>
            <p className={`mt-2 text-8xl font-extrabold tracking-tight ${r.serving ? "text-indigo-700" : "text-slate-200"}`}>
              {r.serving ?? "—"}
            </p>
          </div>
        ))}
      </div>
      {rows?.length === 0 && (
        <p className="text-center text-slate-400">No counters yet — set them up in Admin.</p>
      )}
    </main>
  );
}
