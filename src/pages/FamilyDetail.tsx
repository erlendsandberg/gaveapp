import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getFamily, getFamilyMembers, createManagedProfile } from "../lib/families";
import { nextBirthday, formatBirthday, formatDaysUntil } from "../lib/birthdays";
import type { Family, UserProfile } from "../types";

export function FamilyDetail() {
  const { familyId } = useParams<{ familyId: string }>();
  const { user } = useAuth();
  const [family, setFamily] = useState<Family | null>(null);
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCode, setShowCode] = useState(false);
  const [showAddChild, setShowAddChild] = useState(false);

  useEffect(() => {
    if (!familyId) return;
    Promise.all([getFamily(familyId)]).then(async ([f]) => {
      if (!f) return;
      setFamily(f);
      const m = await getFamilyMembers(f.memberIds);
      setMembers(sortMembers(m));
      setLoading(false);
    });
  }, [familyId]);

  function sortMembers(m: UserProfile[]) {
    return [...m].sort((a, b) => {
      if (!a.birthday) return 1;
      if (!b.birthday) return -1;
      return nextBirthday(a.birthday).daysUntil - nextBirthday(b.birthday).daysUntil;
    });
  }

  function handleChildAdded(child: UserProfile) {
    setMembers((prev) => sortMembers([...prev, child]));
    // Update local family memberIds to avoid stale state
    setFamily((f) => f ? { ...f, memberIds: [...f.memberIds, child.uid] } : f);
    setShowAddChild(false);
  }

  if (loading) return <div className="flex min-h-screen items-center justify-center text-zinc-400">Laster…</div>;
  if (!family) return <div className="p-6 text-center text-zinc-500">Familie ikke funnet.</div>;

  return (
    <div className="mx-auto max-w-xl p-6">
      <header className="mb-6">
        <Link to="/familier" className="mb-1 block text-sm text-zinc-500 hover:text-zinc-800">
          ← Familier
        </Link>
        <div className="flex items-start justify-between gap-2">
          <h1 className="text-2xl font-bold text-zinc-900">{family.name}</h1>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => { setShowAddChild((s) => !s); setShowCode(false); }}
              className="rounded-lg border border-fuchsia-200 bg-fuchsia-50 px-3 py-1.5 text-xs font-semibold text-fuchsia-700 hover:bg-fuchsia-100"
            >
              + Legg til barn
            </button>
            <button
              onClick={() => { setShowCode((s) => !s); setShowAddChild(false); }}
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs text-zinc-500 hover:bg-zinc-50"
            >
              {showCode ? "Skjul kode" : "Invitasjonskode"}
            </button>
          </div>
        </div>

        {showCode && (
          <div className="mt-3 rounded-xl bg-fuchsia-50 border border-fuchsia-200 p-4 text-center">
            <p className="text-xs text-fuchsia-600 mb-1">Del denne koden for å invitere noen</p>
            <p className="text-3xl font-extrabold tracking-widest text-fuchsia-700">{family.inviteCode}</p>
          </div>
        )}

        {showAddChild && (
          <div className="mt-3">
            <AddChildForm
              familyId={family.id}
              managedByUid={user!.uid}
              onDone={handleChildAdded}
              onCancel={() => setShowAddChild(false)}
            />
          </div>
        )}
      </header>

      <div className="space-y-3">
        {members.map((member, idx) => (
          <MemberCard
            key={member.uid}
            member={member}
            isFirst={idx === 0}
            isSelf={member.uid === user?.uid}
            isManagedByMe={member.managedBy === user?.uid}
            familyId={family.id}
          />
        ))}
      </div>
    </div>
  );
}

/* ─── Add child form ─────────────────────────────────────────────────────── */

function AddChildForm({
  familyId,
  managedByUid,
  onDone,
  onCancel,
}: {
  familyId: string;
  managedByUid: string;
  onDone: (child: UserProfile) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [birthday, setBirthday] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !birthday) return;
    setBusy(true);
    setError(null);
    try {
      const child = await createManagedProfile(name, birthday, familyId, managedByUid);
      onDone(child);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Noe gikk galt");
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl bg-white border border-fuchsia-100 p-4 shadow-sm space-y-3"
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xl">👶</span>
        <h3 className="font-semibold text-zinc-900">Legg til barn uten innlogging</h3>
      </div>
      <p className="text-xs text-zinc-500">
        Du administrerer barnets ønskeliste fra din egen bruker.
      </p>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-zinc-700">Navn *</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="F.eks. Emilie"
          autoFocus
          required
          className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 focus:border-fuchsia-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-100"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-zinc-700">Bursdag *</span>
        <input
          type="date"
          value={birthday}
          onChange={(e) => setBirthday(e.target.value)}
          max={new Date().toISOString().split("T")[0]}
          required
          className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 focus:border-fuchsia-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-100"
        />
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-xl border border-zinc-200 py-2.5 text-sm text-zinc-600 hover:bg-zinc-50"
        >
          Avbryt
        </button>
        <button
          type="submit"
          disabled={busy || !name.trim() || !birthday}
          className="flex-1 rounded-xl bg-fuchsia-600 py-2.5 font-semibold text-white hover:bg-fuchsia-700 disabled:opacity-50"
        >
          {busy ? "Legger til…" : "Legg til 👶"}
        </button>
      </div>
    </form>
  );
}

/* ─── Member card ─────────────────────────────────────────────────────────── */

function MemberCard({
  member,
  isFirst,
  isSelf,
  isManagedByMe,
  familyId,
}: {
  member: UserProfile;
  isFirst: boolean;
  isSelf: boolean;
  isManagedByMe: boolean;
  familyId: string;
}) {
  const bday = member.birthday ? nextBirthday(member.birthday) : null;
  const isToday = bday?.isToday ?? false;
  const isSoon = bday?.isSoon ?? false;
  const isNextUp = isFirst && bday !== null;

  const initials = (member.displayName || "?")
    .split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  const isChild = !!member.managedBy;

  return (
    <div
      className={`rounded-2xl p-4 shadow-sm ${
        isToday
          ? "bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300"
          : isNextUp
          ? "bg-gradient-to-r from-fuchsia-50 to-pink-50 border-2 border-fuchsia-200"
          : "bg-white border border-zinc-100"
      }`}
    >
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          {member.photoURL ? (
            <img src={member.photoURL} alt="" className="h-12 w-12 rounded-full object-cover" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-400 to-pink-400 font-bold text-white">
              {initials}
            </div>
          )}
          {isToday && <span className="absolute -top-1 -right-1 text-sm">🎉</span>}
          {isNextUp && !isToday && <span className="absolute -top-1 -right-1 text-sm">🎂</span>}
          {isChild && !isToday && !isNextUp && (
            <span className="absolute -bottom-1 -right-1 text-xs">👶</span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-zinc-900 truncate">{member.displayName}</p>
            {isSelf && (
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">deg</span>
            )}
            {isManagedByMe && (
              <span className="rounded-full bg-fuchsia-100 px-2 py-0.5 text-xs text-fuchsia-600">
                ditt barn
              </span>
            )}
            {isChild && !isManagedByMe && (
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-400">barn</span>
            )}
          </div>
          {bday && (
            <p className="text-xs text-zinc-500">
              {formatBirthday(member.birthday!)} · fyller {bday.age} år
            </p>
          )}
        </div>

        {/* Countdown + lenke */}
        <div className="flex flex-col items-end gap-2">
          {bday && (
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                isToday
                  ? "bg-yellow-300 text-yellow-900"
                  : isSoon
                  ? "bg-fuchsia-100 text-fuchsia-700"
                  : "bg-zinc-100 text-zinc-500"
              }`}
            >
              {formatDaysUntil(bday.daysUntil)}
            </span>
          )}
          <Link
            to={
              isSelf
                ? "/mine-ønsker"
                : `/familie/${familyId}/bruker/${member.uid}`
            }
            className="rounded-lg bg-fuchsia-600 px-3 py-1 text-xs font-semibold text-white hover:bg-fuchsia-700"
          >
            {isSelf ? "Mine ønsker" : isManagedByMe ? "Administrer 🎁" : "Ønskeliste 🎁"}
          </Link>
        </div>
      </div>

      {isNextUp && !isToday && (
        <p className="mt-3 rounded-lg bg-white/70 px-3 py-1.5 text-xs font-medium text-fuchsia-700">
          🎂 Neste bursdag i familien — {formatDaysUntil(bday!.daysUntil)}
        </p>
      )}
      {isToday && (
        <p className="mt-3 rounded-lg bg-yellow-100 px-3 py-1.5 text-xs font-bold text-yellow-800">
          🎉 I dag er det {member.displayName.split(" ")[0]}s bursdag!
        </p>
      )}
    </div>
  );
}
