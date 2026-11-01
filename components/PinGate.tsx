"use client";

import { useEffect, useState } from "react";

type Role = "admin" | "staff";

/** PIN entry gate. Renders children once the role cookie is present. */
export default function PinGate({ role, title, children }: { role: Role; title: string; children: React.ReactNode }) {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  // Check current session on mount.
  useEffect(() => {
    fetch("/api/auth")
      .then((r) => r.json())
      .then((d) => setAuthed(role === "admin" ? d.admin : d.staff))
      .catch(() => setAuthed(false));
  }, [role]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, pin }),
    });
    if (res.ok) setAuthed(true);
    else setError("Wrong PIN — try again.");
    setPin("");
  }

  if (authed === null) return <p className="text-center text-slate-400">Loading…</p>;

  if (!authed) {
    return (
      <main className="mx-auto max-w-sm pt-16">
        <div className="card">
          <h1 className="mb-4 text-2xl font-bold">{title}</h1>
          <p className="mb-4 text-sm text-slate-500">Enter the {role} PIN to continue.</p>
          <form onSubmit={submit} className="space-y-3">
            <input
              type="password"
              inputMode="numeric"
              autoComplete="off"
              className="input text-center text-2xl tracking-widest"
              placeholder="••••"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              autoFocus
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" className="btn-primary w-full">Unlock</button>
          </form>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
