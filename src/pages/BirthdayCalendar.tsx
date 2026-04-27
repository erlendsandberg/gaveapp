import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import type { UserProfile } from "../types";
import {
  nextBirthday,
  sortByUpcoming,
  formatBirthday,
  formatDaysUntil,
} from "../lib/birthdays";

export function BirthdayCalendar() {
  const { profile } = useAuth();
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db || !profile) return;

    async function fetchMembers() {
      if (!db) return;
      // Når familier er på plass (Fase 2) henter vi kun familiemedlemmer.
      // Inntil da viser vi alle brukere som har lagt inn bursdag.
      const snap = await getDocs(collection(db, "users"));
      const all = snap.docs.map((d) => d.data() as UserProfile);
      setMembers(all.filter((u) => u.birthday));
      setLoading(false);
    }

    fetchMembers();
  }, [profile]);

  const sorted = sortByUpcoming(members);

  return (
    <div className="mx-auto max-w-2xl p-6">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <Link to="/" className="mb-1 block text-sm text-zinc-500 hover:text-zinc-800">
            ← Tilbake
          </Link>
          <h1 className="text-2xl font-bold text-zinc-900">Bursdagskalender 🎂</h1>
        </div>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-zinc-400">
          Laster…
        </div>
      ) : sorted.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {sorted.map((member) => (
            <BirthdayCard key={member.uid} member={member} />
          ))}
        </div>
      )}
    </div>
  );
}

function BirthdayCard({ member }: { member: UserProfile }) {
  const { isToday, isSoon, daysUntil, age } = nextBirthday(member.birthday!);

  const bg = isToday
    ? "bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-300"
    : isSoon
    ? "bg-gradient-to-r from-fuchsia-50 to-pink-50 border-fuchsia-200"
    : "bg-white border-zinc-100";

  return (
    <div className={`flex items-center gap-4 rounded-2xl border-2 p-4 shadow-sm ${bg}`}>
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        {member.photoURL ? (
          <img
            src={member.photoURL}
            alt=""
            className="h-12 w-12 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-400 to-pink-400 text-lg font-bold text-white">
            {member.displayName?.[0]?.toUpperCase() ?? "?"}
          </div>
        )}
        {isToday && (
          <span className="absolute -top-1 -right-1 text-base">🎉</span>
        )}
        {isSoon && !isToday && (
          <span className="absolute -top-1 -right-1 text-base">🎈</span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-zinc-900 truncate">{member.displayName}</p>
        <p className="text-sm text-zinc-500">
          {formatBirthday(member.birthday!)} · fyller {age} år
        </p>
      </div>

      {/* Countdown */}
      <div className="flex-shrink-0 text-right">
        <span
          className={`inline-block rounded-full px-3 py-1 text-sm font-semibold ${
            isToday
              ? "bg-yellow-400 text-yellow-900"
              : isSoon
              ? "bg-fuchsia-100 text-fuchsia-800"
              : daysUntil <= 30
              ? "bg-pink-50 text-pink-700"
              : "bg-zinc-100 text-zinc-600"
          }`}
        >
          {formatDaysUntil(daysUntil)}
        </span>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
      <p className="text-4xl mb-3">🎂</p>
      <p className="font-semibold text-zinc-800">Ingen bursdager ennå</p>
      <p className="mt-1 text-sm text-zinc-500">
        Inviter familien så dukker bursdagene opp her automatisk.
      </p>
    </div>
  );
}
