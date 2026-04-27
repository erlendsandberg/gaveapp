import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { createFamily, joinFamily, getUserFamilies } from "../lib/families";
import type { Family } from "../types";

export function Families() {
  const { user } = useAuth();
  const [families, setFamilies] = useState<Family[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "create" | "join">("list");

  useEffect(() => {
    if (!user) return;
    getUserFamilies(user.uid).then((f) => {
      setFamilies(f);
      setLoading(false);
    });
  }, [user]);

  function onFamilyAdded(f: Family) {
    setFamilies((prev) => [...prev, f]);
    setView("list");
  }

  return (
    <div className="mx-auto max-w-xl p-6">
      <header className="mb-6">
        <Link to="/" className="mb-1 block text-sm text-zinc-500 hover:text-zinc-800">← Tilbake</Link>
        <h1 className="text-2xl font-bold text-zinc-900">Mine familier 👨‍👩‍👧‍👦</h1>
      </header>

      {view === "list" && (
        <>
          {loading ? (
            <div className="py-12 text-center text-zinc-400">Laster…</div>
          ) : families.length === 0 ? (
            <div className="mb-6 rounded-2xl bg-white p-8 text-center shadow-sm">
              <p className="text-3xl mb-2">👨‍👩‍👧</p>
              <p className="font-semibold text-zinc-800">Ingen familier ennå</p>
              <p className="mt-1 text-sm text-zinc-500">Opprett en familie eller bli med via kode.</p>
            </div>
          ) : (
            <div className="mb-6 space-y-3">
              {families.map((f) => (
                <Link
                  key={f.id}
                  to={`/familie/${f.id}`}
                  className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm hover:shadow-md transition group"
                >
                  <div>
                    <p className="font-semibold text-zinc-900 group-hover:text-fuchsia-700">{f.name}</p>
                    <p className="text-xs text-zinc-400">{f.memberIds.length} {f.memberIds.length === 1 ? "medlem" : "medlemmer"}</p>
                  </div>
                  <span className="text-zinc-300 group-hover:text-fuchsia-400">→</span>
                </Link>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setView("create")}
              className="rounded-2xl bg-fuchsia-600 py-3 font-semibold text-white hover:bg-fuchsia-700"
            >
              + Opprett familie
            </button>
            <button
              onClick={() => setView("join")}
              className="rounded-2xl border-2 border-fuchsia-200 py-3 font-semibold text-fuchsia-700 hover:bg-fuchsia-50"
            >
              Bli med via kode
            </button>
          </div>
        </>
      )}

      {view === "create" && (
        <CreateForm
          uid={user!.uid}
          onDone={onFamilyAdded}
          onBack={() => setView("list")}
        />
      )}

      {view === "join" && (
        <JoinForm
          uid={user!.uid}
          onDone={onFamilyAdded}
          onBack={() => setView("list")}
        />
      )}
    </div>
  );
}

function CreateForm({ uid, onDone, onBack }: { uid: string; onDone: (f: Family) => void; onBack: () => void }) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const f = await createFamily(name, uid);
      onDone(f);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Noe gikk galt");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-6 shadow-sm space-y-4">
      <h2 className="font-semibold text-zinc-900">Ny familie</h2>
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-zinc-700">Navn på familien</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="F.eks. Familie Sandberg"
          autoFocus
          required
          className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 focus:border-fuchsia-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-100"
        />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-3">
        <button type="button" onClick={onBack} className="flex-1 rounded-xl border border-zinc-200 py-2.5 text-sm text-zinc-600 hover:bg-zinc-50">Avbryt</button>
        <button type="submit" disabled={busy} className="flex-1 rounded-xl bg-fuchsia-600 py-2.5 font-semibold text-white hover:bg-fuchsia-700 disabled:opacity-50">
          {busy ? "Oppretter…" : "Opprett"}
        </button>
      </div>
    </form>
  );
}

function JoinForm({ uid, onDone, onBack }: { uid: string; onDone: (f: Family) => void; onBack: () => void }) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const f = await joinFamily(code, uid);
      onDone(f);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Noe gikk galt");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-6 shadow-sm space-y-4">
      <h2 className="font-semibold text-zinc-900">Bli med i familie</h2>
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-zinc-700">Invitasjonskode</span>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="F.eks. ABX4K2"
          maxLength={6}
          autoFocus
          required
          className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-center text-2xl font-bold tracking-widest uppercase focus:border-fuchsia-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-100"
        />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-3">
        <button type="button" onClick={onBack} className="flex-1 rounded-xl border border-zinc-200 py-2.5 text-sm text-zinc-600 hover:bg-zinc-50">Avbryt</button>
        <button type="submit" disabled={busy || code.length < 6} className="flex-1 rounded-xl bg-fuchsia-600 py-2.5 font-semibold text-white hover:bg-fuchsia-700 disabled:opacity-50">
          {busy ? "Søker…" : "Bli med"}
        </button>
      </div>
    </form>
  );
}
