"use client";

import { useCallback, useEffect, useState } from "react";
import PinGate from "@/components/PinGate";

type Counter = { id: number; name: string; queue: { id: number; name: string } };
type WaitingTicket = { id: number; number: string; customerName: string | null; createdAt: string };
type ServingTicket = { id: number; number: string; customerName: string | null; calledAt: string } | null;

type State = {
  counters: Counter[];
  selectedCounterId: number | null;
  waiting: WaitingTicket[];
  serving: ServingTicket;
};

function StaffConsole() {
  const [s, setS] = useState<State | null>(null);
  const [counterId, setCounterId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(
    (cid: number | null) => {
      fetch(`/api/staff/state${cid ? `?counterId=${cid}` : ""}`)
        .then((r) => r.json())
        .then((d: State) => {
          setS(d);
          // Auto-select the first counter on first load.
          if (cid === null && d.selectedCounterId === null && d.counters.length > 0) {
            setCounterId(d.counters[0].id);
          }
        });
    },
    []
  );

  useEffect(() => {
    load(counterId);
    const timer = setInterval(() => load(counterId), 5000);
    return () => clearInterval(timer);
  }, [counterId, load]);

  async function action(url: string, body: object) {
    setBusy(true);
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) alert(data.error || "Something went wrong");
    load(counterId);
  }

  const counter = s?.counters.find((c) => c.id === counterId);

  return (
    <main className="space-y-4">
      <h1 className="text-2xl font-bold">🧑‍💼 Staff console</h1>

      <div>
        <label className="label" htmlFor="counter">Counter</label>
        <select
          id="counter"
          className="input"
          value={counterId ?? ""}
          onChange={(e) => setCounterId(Number(e.target.value))}
        >
          {s?.counters.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} — {c.queue.name}
            </option>
          ))}
        </select>
      </div>

      {counter && (
        <>
          <div className="card text-center">
            <p className="text-sm uppercase tracking-widest text-slate-400">Now serving</p>
            <p className="my-2 text-6xl font-extrabold">
              {s?.serving ? s.serving.number : "—"}
            </p>
            {s?.serving?.customerName && (
              <p className="text-slate-500">{s.serving.customerName}</p>
            )}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                disabled={busy}
                onClick={() => action("/api/staff/call-next", { counterId })}
                className="btn-green text-lg"
              >
                📢 Call next
              </button>
              <button
                disabled={busy || !s?.serving}
                onClick={() => action("/api/staff/recall", { counterId })}
                className="btn-amber"
              >
                🔁 Recall
              </button>
              <button
                disabled={busy || !s?.serving}
                onClick={() => action("/api/staff/complete", { ticketId: s?.serving?.id })}
                className="btn-primary"
              >
                ✅ Served
              </button>
              <button
                disabled={busy || !s?.serving}
                onClick={() => action("/api/staff/no-show", { ticketId: s?.serving?.id })}
                className="btn-slate"
              >
                🚫 No-show
              </button>
            </div>
          </div>

          <div className="card">
            <h2 className="mb-3 font-bold">
              Waiting ({s?.waiting.length ?? 0})
            </h2>
            {(s?.waiting.length ?? 0) === 0 && (
              <p className="text-slate-400">Nobody waiting. Nice.</p>
            )}
            <ul className="divide-y divide-slate-100">
              {s?.waiting.map((t, i) => (
                <li key={t.id} className="flex items-center justify-between py-2">
                  <span>
                    <span className="mr-2 text-xs text-slate-400">#{i + 1}</span>
                    <span className="text-lg font-bold">{t.number}</span>
                    {t.customerName && <span className="ml-2 text-slate-500">{t.customerName}</span>}
                  </span>
                  <button
                    disabled={busy}
                    onClick={() => action("/api/staff/no-show", { ticketId: t.id })}
                    className="rounded-lg px-3 py-1 text-sm text-slate-500 hover:bg-slate-100"
                    title="Mark as no-show"
                  >
                    skip
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </main>
  );
}

export default function StaffPage() {
  return (
    <PinGate role="staff" title="Staff login">
      <StaffConsole />
    </PinGate>
  );
}
