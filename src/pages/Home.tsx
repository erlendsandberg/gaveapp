import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { signOutUser } from "../lib/auth";
import type { UserProfile } from "../types";
import { nextBirthday, sortByUpcoming, formatBirthday, formatDaysUntil } from "../lib/birthdays";

export function Home() {
  const { profile } = useAuth();
  const [upcoming, setUpcoming] = useState<UserProfile[]>([]);

  useEffect(() => {
    if (!db || !profile) return;
    async function fetchUpcoming() {
      if (!db) return;
      const snap = await getDocs(collection(db, "users"));
      const all = snap.docs.map((d) => d.data() as UserProfile);
      const withBday = sortByUpcoming(all.filter((u) => u.birthday));
      setUpcoming(withBday.slice(0, 3));
    }
    fetchUpcoming();
  }, [profile]);

  return (
    <div className="mx-auto max-w-3xl p-6">
      <header className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900">
          Hei, {profile?.displayName || "der"} 👋
        </h1>
        <div className="flex items-center gap-4">
          <Link to="/profil" className="text-sm text-zinc-600 hover:text-zinc-900">
            Min profil
          </Link>
          <button
            onClick={() => signOutUser()}
            className="text-sm text-zinc-500 hover:text-zinc-800"
          >
            Logg ut
          </button>
        </div>
      </header>

      {/* Bursdager snart */}
      <section className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-zinc-800">Bursdager fremover 🎂</h2>
          <Link to="/kalender" className="text-sm font-medium text-fuchsia-600 hover:underline">
            Se alle →
          </Link>
        </div>
        {upcoming.length === 0 ? (
          <div className="rounded-2xl bg-white p-5 text-center text-sm text-zinc-400 shadow-sm">
            Ingen bursdager registrert ennå
          </div>
        ) : (
          <div className="space-y-2">
            {upcoming.map((member) => {
              const { isToday, isSoon, daysUntil, age } = nextBirthday(member.birthday!);
              const isSelf = member.uid === profile?.uid;
              const href = isSelf ? "/mine-ønsker" : `/bruker/${member.uid}`;
              return (
                <Link
                  key={member.uid}
                  to={href}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 shadow-sm transition hover:shadow-md group ${
                    isToday
                      ? "bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200"
                      : isSoon
                      ? "bg-gradient-to-r from-fuchsia-50 to-pink-50 border border-fuchsia-100"
                      : "bg-white border border-zinc-100 hover:border-fuchsia-200"
                  }`}
                >
                  {member.photoURL ? (
                    <img src={member.photoURL} alt="" className="h-9 w-9 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-400 to-pink-400 text-sm font-bold text-white">
                      {member.displayName?.[0]?.toUpperCase() ?? "?"}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-zinc-900 group-hover:text-fuchsia-700">
                      {member.displayName}
                    </span>
                    <span className="ml-2 text-xs text-zinc-400">
                      {formatBirthday(member.birthday!)} · fyller {age}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-semibold ${
                        isToday ? "text-orange-600" : isSoon ? "text-fuchsia-600" : "text-zinc-500"
                      }`}
                    >
                      {formatDaysUntil(daysUntil)}
                    </span>
                    <span className="text-zinc-300 group-hover:text-fuchsia-400 transition">→</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Hurtiglenker */}
      <section className="grid grid-cols-2 gap-4">
        <Link
          to="/familier"
          className="rounded-2xl bg-gradient-to-br from-fuchsia-500 to-pink-500 p-5 shadow-sm hover:shadow-md transition group"
        >
          <span className="text-3xl">👨‍👩‍👧‍👦</span>
          <p className="mt-2 font-semibold text-white">Mine familier</p>
          <p className="text-xs text-fuchsia-100">Ønskelister og bursdager</p>
        </Link>
        <Link
          to="/mine-ønsker"
          className="rounded-2xl bg-white p-5 shadow-sm hover:shadow-md transition group"
        >
          <span className="text-3xl">🎁</span>
          <p className="mt-2 font-semibold text-zinc-900 group-hover:text-fuchsia-700">Mine ønsker</p>
          <p className="text-xs text-zinc-500">Din ønskeliste</p>
        </Link>
        <Link
          to="/kalender"
          className="rounded-2xl bg-white p-5 shadow-sm hover:shadow-md transition group"
        >
          <span className="text-3xl">🎂</span>
          <p className="mt-2 font-semibold text-zinc-900 group-hover:text-fuchsia-700">Kalender</p>
          <p className="text-xs text-zinc-500">Alle bursdager</p>
        </Link>
        <Link
          to="/profil"
          className="rounded-2xl bg-white p-5 shadow-sm hover:shadow-md transition group"
        >
          <span className="text-3xl">👤</span>
          <p className="mt-2 font-semibold text-zinc-900 group-hover:text-fuchsia-700">Min profil</p>
          <p className="text-xs text-zinc-500">Navn og bursdag</p>
        </Link>
      </section>
    </div>
  );
}
