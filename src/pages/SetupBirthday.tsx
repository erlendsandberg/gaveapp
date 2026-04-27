import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";

export function SetupBirthday() {
  const { user } = useAuth();
  const [birthday, setBirthday] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !db || !birthday) return;
    setSaving(true);
    setError(null);
    try {
      await updateDoc(doc(db, "users", user.uid), { birthday });
    } catch {
      setError("Noe gikk galt. Prøv igjen.");
      setSaving(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-fuchsia-50 to-pink-100 p-6">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-xl text-center">
        <div className="mb-4 text-6xl">🎂</div>
        <h1 className="text-2xl font-bold text-zinc-900 mb-2">Når er du født?</h1>
        <p className="text-zinc-500 text-sm mb-8">
          Bursdagen din legges automatisk inn i familiekalenderen, så ingen glemmer deg!
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="date"
            value={birthday}
            onChange={(e) => setBirthday(e.target.value)}
            max={new Date().toISOString().split("T")[0]}
            required
            autoFocus
            className="w-full rounded-xl border-2 border-zinc-200 px-4 py-3 text-center text-lg focus:border-fuchsia-400 focus:outline-none"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={saving || !birthday}
            className="w-full rounded-xl bg-gradient-to-r from-fuchsia-600 to-pink-600 py-3 font-bold text-white shadow-md transition hover:scale-[1.02] disabled:opacity-50"
          >
            {saving ? "Lagrer…" : "Lagre bursdag 🎉"}
          </button>
        </form>
      </div>
    </div>
  );
}
