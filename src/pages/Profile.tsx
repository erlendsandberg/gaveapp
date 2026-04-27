import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { signOutUser, changePassword, isUsernameAccount } from "../lib/auth";
import { useAuth } from "../context/AuthContext";
import { nextBirthday, formatBirthday, formatDaysUntil } from "../lib/birthdays";

export function Profile() {
  const { user, profile } = useAuth();

  if (!user) return null;

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="text-4xl animate-bounce">🎂</span>
      </div>
    );
  }

  const isUsername = isUsernameAccount(user.email);

  return (
    <div className="mx-auto max-w-xl p-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <Link to="/" className="mb-1 block text-sm text-zinc-500 hover:text-zinc-800">
            ← Tilbake
          </Link>
          <h1 className="text-2xl font-bold text-zinc-900">Min profil</h1>
        </div>
        <button
          onClick={() => signOutUser()}
          className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50"
        >
          Logg ut
        </button>
      </header>

      <div className="space-y-4">
        <AvatarCard profile={profile} isUsername={isUsername} />
        <EditInfoCard uid={user.uid} profile={profile} />
        {profile.birthday && <BirthdayWidget birthday={profile.birthday} name={profile.displayName} />}
        {isUsername && <ChangePasswordCard />}
      </div>
    </div>
  );
}

/* ─── Avatar ────────────────────────────────────── */

function AvatarCard({
  profile,
  isUsername,
}: {
  profile: ReturnType<typeof useAuth>["profile"] & object;
  isUsername: boolean;
}) {
  const initials = (profile!.displayName || "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex items-center gap-5 rounded-2xl bg-white p-5 shadow-sm">
      {profile!.photoURL ? (
        <img
          src={profile!.photoURL}
          alt=""
          className="h-20 w-20 rounded-full object-cover ring-4 ring-fuchsia-100"
        />
      ) : (
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500 to-pink-500 text-2xl font-bold text-white ring-4 ring-fuchsia-100">
          {initials}
        </div>
      )}
      <div>
        <p className="text-xl font-bold text-zinc-900">{profile!.displayName}</p>
        {isUsername ? (
          <p className="mt-0.5 text-sm text-zinc-400">
            Brukernavn:{" "}
            <span className="font-medium text-zinc-600">
              {profile!.username ?? "–"}
            </span>
          </p>
        ) : (
          <p className="mt-0.5 text-sm text-zinc-400">{profile!.email}</p>
        )}
        <span className="mt-1 inline-block rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">
          {isUsername ? "🔑 Brukernavn-konto" : "🔵 Google-konto"}
        </span>
      </div>
    </div>
  );
}

/* ─── Rediger info ───────────────────────────────── */

function EditInfoCard({
  uid,
  profile,
}: {
  uid: string;
  profile: NonNullable<ReturnType<typeof useAuth>["profile"]>;
}) {
  const [displayName, setDisplayName] = useState(profile.displayName ?? "");
  const [birthday, setBirthday] = useState(profile.birthday ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setDisplayName(profile.displayName ?? "");
    setBirthday(profile.birthday ?? "");
  }, [profile]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!db) return;
    setSaving(true);
    setSaved(false);
    try {
      await updateDoc(doc(db, "users", uid), {
        displayName: displayName.trim(),
        birthday: birthday || null,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="rounded-2xl bg-white p-5 shadow-sm space-y-4">
      <h2 className="font-semibold text-zinc-800">Rediger profil</h2>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-zinc-700">Navn</span>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
          className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 focus:border-fuchsia-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-100"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-zinc-700">Bursdag</span>
        <input
          type="date"
          value={birthday}
          onChange={(e) => setBirthday(e.target.value)}
          max={new Date().toISOString().split("T")[0]}
          className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 focus:border-fuchsia-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-100"
        />
      </label>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-fuchsia-600 px-5 py-2.5 font-semibold text-white transition hover:bg-fuchsia-700 disabled:opacity-50"
        >
          {saving ? "Lagrer…" : "Lagre endringer"}
        </button>
        {saved && (
          <span className="flex items-center gap-1 text-sm text-green-600">
            ✓ Lagret
          </span>
        )}
      </div>
    </form>
  );
}

/* ─── Bursdag-widget ────────────────────────────── */

function BirthdayWidget({ birthday, name }: { birthday: string; name: string }) {
  const { daysUntil, age, isToday, isSoon } = nextBirthday(birthday);

  const bg = isToday
    ? "from-yellow-400 to-orange-400"
    : isSoon
    ? "from-fuchsia-500 to-pink-500"
    : "from-violet-500 to-fuchsia-500";

  return (
    <div className={`rounded-2xl bg-gradient-to-r ${bg} p-5 text-white shadow-sm`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-80">
            {isToday ? "🎉 I dag er det bursdag!" : "Neste bursdag"}
          </p>
          <p className="mt-1 text-2xl font-bold">{formatBirthday(birthday)}</p>
          <p className="mt-0.5 text-sm opacity-80">
            {isToday
              ? `Gratulerer, ${name}! Du fyller ${age} år i dag 🎂`
              : `${name} fyller ${age} år`}
          </p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-extrabold">
            {isToday ? "🎂" : daysUntil}
          </p>
          {!isToday && (
            <p className="text-xs opacity-80">{daysUntil === 1 ? "dag igjen" : "dager igjen"}</p>
          )}
        </div>
      </div>
      {!isToday && (
        <p className="mt-3 rounded-lg bg-white/20 px-3 py-1.5 text-sm font-medium">
          {formatDaysUntil(daysUntil)}
        </p>
      )}
    </div>
  );
}

/* ─── Endre passord ─────────────────────────────── */

function ChangePasswordCard() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (next !== confirm) {
      setError("De nye passordene stemmer ikke overens");
      return;
    }
    setSaving(true);
    try {
      await changePassword(current, next);
      setSuccess(true);
      setCurrent(""); setNext(""); setConfirm("");
      setTimeout(() => { setSuccess(false); setOpen(false); }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Feil ved passordbytte");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <button
        onClick={() => { setOpen((o) => !o); setError(null); }}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="font-semibold text-zinc-800">Endre passord</span>
        <span className="text-zinc-400">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          {[
            { label: "Nåværende passord", value: current, set: setCurrent, auto: "current-password" },
            { label: "Nytt passord", value: next, set: setNext, auto: "new-password" },
            { label: "Bekreft nytt passord", value: confirm, set: setConfirm, auto: "new-password" },
          ].map(({ label, value, set, auto }) => (
            <label key={label} className="block">
              <span className="mb-1 block text-sm font-medium text-zinc-700">{label}</span>
              <input
                type="password"
                value={value}
                onChange={(e) => set(e.target.value)}
                autoComplete={auto}
                required
                minLength={6}
                className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 focus:border-fuchsia-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-100"
              />
            </label>
          ))}

          {error && <p className="rounded-lg bg-red-50 p-2 text-sm text-red-700">{error}</p>}
          {success && <p className="rounded-lg bg-green-50 p-2 text-sm text-green-700">✓ Passord endret!</p>}

          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-zinc-800 px-5 py-2.5 font-semibold text-white transition hover:bg-zinc-900 disabled:opacity-50"
          >
            {saving ? "Endrer…" : "Endre passord"}
          </button>
        </form>
      )}
    </div>
  );
}
