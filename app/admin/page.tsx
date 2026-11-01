"use client";

import { useCallback, useEffect, useState } from "react";
import PinGate from "@/components/PinGate";

type Counter = { id: number; name: string };
type Queue = {
  id: number;
  name: string;
  prefix: string;
  avgServiceMinutes: number;
  isOpen: boolean;
  counters: Counter[];
  active: number;
};

function AdminConsole() {
  const [queues, setQueues] = useState<Queue[]>([]);
  const [qr, setQr] = useState<{ url: string; dataUrl: string } | null>(null);
  const [newName, setNewName] = useState("");
  const [newPrefix, setNewPrefix] = useState("A");
  const [newAvg, setNewAvg] = useState(5);
  const [counterNames, setCounterNames] = useState<Record<number, string>>({});
  const [editing, setEditing] = useState<Record<number, { name: string; prefix: string; avg: number }>>({});

  const load = useCallback(() => {
    fetch("/api/admin/queues").then((r) => r.json()).then(setQueues).catch(() => {});
  }, []);
  useEffect(() => {
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, [load]);

  async function req(url: string, method: string, body?: object) {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) alert(data.error || "Something went wrong");
    load();
  }

  async function createQueue(e: React.FormEvent) {
    e.preventDefault();
    await req("/api/admin/queues", "POST", { name: newName, prefix: newPrefix, avgServiceMinutes: newAvg });
    setNewName("");
    setNewPrefix("A");
    setNewAvg(5);
  }

  async function showQr(queueId: number) {
    const res = await fetch(`/api/admin/qr?queueId=${queueId}`);
    setQr(await res.json());
  }

  async function resetDay() {
    if (!confirm("End-of-day reset? This clears ALL tickets and restarts numbering at 1.")) return;
    await req("/api/admin/reset", "POST");
  }

  async function logout() {
    await fetch("/api/auth", { method: "DELETE" });
    location.reload();
  }

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">⚙️ Admin</h1>
        <button onClick={logout} className="btn-slate !px-3 !py-2 text-sm">Log out</button>
      </div>

      {/* Create queue */}
      <div className="card">
        <h2 className="mb-3 font-bold">New queue</h2>
        <form onSubmit={createQueue} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <input className="input col-span-2" placeholder="Queue name" value={newName} onChange={(e) => setNewName(e.target.value)} required maxLength={80} />
          <input className="input" placeholder="Prefix (A)" value={newPrefix} onChange={(e) => setNewPrefix(e.target.value)} maxLength={3} />
          <input className="input" type="number" min={1} max={120} title="Avg service minutes" value={newAvg} onChange={(e) => setNewAvg(Number(e.target.value))} />
          <button type="submit" className="btn-primary col-span-2 sm:col-span-4">Create queue</button>
        </form>
      </div>

      {/* Queues */}
      {queues.map((q) => {
        const ed = editing[q.id];
        return (
          <div key={q.id} className="card space-y-3">
            <div className="flex items-center justify-between gap-2">
              {ed ? (
                <div className="grid flex-1 grid-cols-3 gap-2">
                  <input className="input" value={ed.name} onChange={(e) => setEditing({ ...editing, [q.id]: { ...ed, name: e.target.value } })} />
                  <input className="input" value={ed.prefix} onChange={(e) => setEditing({ ...editing, [q.id]: { ...ed, prefix: e.target.value } })} maxLength={3} />
                  <input className="input" type="number" min={1} max={120} value={ed.avg} onChange={(e) => setEditing({ ...editing, [q.id]: { ...ed, avg: Number(e.target.value) } })} />
                </div>
              ) : (
                <div>
                  <span className="text-xl font-bold">{q.name}</span>
                  <span className="ml-2 text-sm text-slate-400">
                    prefix {q.prefix} · ~{q.avgServiceMinutes} min · {q.active} active
                  </span>
                </div>
              )}
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${q.isOpen ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"}`}>
                {q.isOpen ? "OPEN" : "CLOSED"}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {ed ? (
                <>
                  <button className="btn-primary !px-3 !py-2 text-sm" onClick={() => { req(`/api/admin/queues/${q.id}`, "PATCH", { name: ed.name, prefix: ed.prefix, avgServiceMinutes: ed.avg }); setEditing({ ...editing, [q.id]: undefined as never }); }}>Save</button>
                  <button className="btn-slate !px-3 !py-2 text-sm" onClick={() => setEditing({ ...editing, [q.id]: undefined as never })}>Cancel</button>
                </>
              ) : (
                <button className="btn-slate !px-3 !py-2 text-sm" onClick={() => setEditing({ ...editing, [q.id]: { name: q.name, prefix: q.prefix, avg: q.avgServiceMinutes } })}>Edit</button>
              )}
              <button className={q.isOpen ? "btn-amber !px-3 !py-2 text-sm" : "btn-green !px-3 !py-2 text-sm"} onClick={() => req(`/api/admin/queues/${q.id}`, "PATCH", { isOpen: !q.isOpen })}>
                {q.isOpen ? "Close queue" : "Open queue"}
              </button>
              <button className="btn-slate !px-3 !py-2 text-sm" onClick={() => showQr(q.id)}>📱 QR code</button>
              <button className="btn-red !px-3 !py-2 text-sm" onClick={() => { if (confirm(`Delete queue "${q.name}" and all its data?`)) req(`/api/admin/queues/${q.id}`, "DELETE"); }}>Delete</button>
            </div>

            {/* Counters */}
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="mb-2 text-sm font-semibold text-slate-500">Counters</p>
              <ul className="mb-2 space-y-1">
                {q.counters.map((c) => (
                  <li key={c.id} className="flex items-center justify-between text-sm">
                    <span>{c.name}</span>
                    <button className="text-red-500 hover:underline" onClick={() => req(`/api/admin/counters/${c.id}`, "DELETE")}>remove</button>
                  </li>
                ))}
                {q.counters.length === 0 && <li className="text-sm text-slate-400">No counters yet.</li>}
              </ul>
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  const name = (counterNames[q.id] || "").trim();
                  if (!name) return;
                  req("/api/admin/counters", "POST", { queueId: q.id, name });
                  setCounterNames({ ...counterNames, [q.id]: "" });
                }}
              >
                <input className="input !py-2 text-sm" placeholder="New counter name" value={counterNames[q.id] || ""} onChange={(e) => setCounterNames({ ...counterNames, [q.id]: e.target.value })} maxLength={60} />
                <button type="submit" className="btn-slate !px-3 !py-2 text-sm">Add</button>
              </form>
            </div>
          </div>
        );
      })}

      {/* QR modal-ish panel */}
      {qr && (
        <div className="card text-center">
          <h2 className="mb-2 font-bold">Join QR code</h2>
          <img src={qr.dataUrl} alt="Queue QR code" className="mx-auto h-56 w-56" />
          <p className="mt-2 break-all text-xs text-slate-400">{qr.url}</p>
          <button className="btn-slate mt-3 !px-3 !py-2 text-sm" onClick={() => setQr(null)}>Close</button>
        </div>
      )}

      {/* End of day */}
      <div className="card">
        <h2 className="mb-2 font-bold">End of day</h2>
        <p className="mb-3 text-sm text-slate-500">Clear all tickets and restart numbering at 1.</p>
        <button onClick={resetDay} className="btn-red">Reset all queues</button>
      </div>
    </main>
  );
}

export default function AdminPage() {
  return (
    <PinGate role="admin" title="Admin login">
      <AdminConsole />
    </PinGate>
  );
}
