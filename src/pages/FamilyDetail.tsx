import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getFamily, getFamilyMembers } from "../lib/families";
import { nextBirthday, formatBirthday, formatDaysUntil } from "../lib/birthdays";
import type { Family, UserProfile } from "../types";

export function FamilyDetail() {
  const { familyId } = useParams<{ familyId: string }>();
  const { user } = useAuth();
  const [family, setFamily] = useState<Family | null>(null);
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCode, setShowCode] = useState(false);

  useEffect(() => {
    if (!familyId) return;
    Promise.all([getFamily(familyId)]).then(async ([f]) => {
      if (!f) return;
      setFamily(f);
      const m = await getFamilyMembers(f.memberIds);
      // Sorter etter neste bursdag
      const sorted = [...m].sort((a, b) => {
        if (!a.birthday) return 1;
        if (!b.birthday) return -1;
        return nextBirthday(a.birthday).daysUntil - nextBirthday(b.birthday).daysUntil;
      });
      setMembers(sorted);
      setLoading(false);
    });
  }, [familyId]);

  if (loading) return <div className="flex min-h-screen items-center justify-center text-zinc-400">Laster…</div>;
  if (!family) return <div className="p-6 text-center text-zinc-500">Familie ikke funnet.</div>;

  return (
    <div className="mx-auto max-w-xl p-6">
      <header className="mb-6">
        <Link to="/familier" className="mb-1 block text-sm text-zinc-500 hover:text-zinc-800">← Familier</Link>
        <div className="flex items-start justify-between">
          <h1 className="text-2xl font-bold text-zinc-900">{family.name}</h1>
          <button
            onClick={() => setShowCode((s) => !s)}
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs text-zinc-500 hover:bg-zinc-50"
          >
            {showCode ? "Skjul kode" : "Vis invitasjonskode"}
          </button>
        </div>
        {showCode && (
          <div className="mt-3 rounded-xl bg-fuchsia-50 border border-fuchsia-200 p-4 text-center">
            <p className="text-xs text-fuchsia-600 mb-1">Del denne koden for å invitere noen</p>
            <p className="text-3xl font-extrabold tracking-widest text-fuchsia-700">{family.inviteCode}</p>
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
            familyId={family.id}
          />
        ))}
      </div>
    </div>
  );
}

function MemberCard({
  member,
  isFirst,
  isSelf,
  familyId,
}: {
  member: UserProfile;
  isFirst: boolean;
  isSelf: boolean;
  familyId: string;
}) {
  const bday = member.birthday ? nextBirthday(member.birthday) : null;
  const isToday = bday?.isToday ?? false;
  const isSoon = bday?.isSoon ?? false;
  const isNextUp = isFirst && bday !== null;

  const initials = (member.displayName || "?")
    .split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className={`rounded-2xl p-4 shadow-sm ${isToday ? "bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300" : isNextUp ? "bg-gradient-to-r from-fuchsia-50 to-pink-50 border-2 border-fuchsia-200" : "bg-white border border-zinc-100"}`}>
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
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-zinc-900 truncate">{member.displayName}</p>
            {isSelf && <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">deg</span>}
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
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${isToday ? "bg-yellow-300 text-yellow-900" : isSoon ? "bg-fuchsia-100 text-fuchsia-700" : "bg-zinc-100 text-zinc-500"}`}>
              {formatDaysUntil(bday.daysUntil)}
            </span>
          )}
          <Link
            to={isSelf ? "/mine-ønsker" : `/familie/${familyId}/bruker/${member.uid}`}
            className="rounded-lg bg-fuchsia-600 px-3 py-1 text-xs font-semibold text-white hover:bg-fuchsia-700"
          >
            {isSelf ? "Mine ønsker" : "Ønskeliste 🎁"}
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
