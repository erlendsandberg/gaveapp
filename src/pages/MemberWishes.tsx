import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getFamily, getFamilyMembers } from "../lib/families";
import { getWishesByOwner, reserveWish, unreserveWish } from "../lib/wishes";
import { nextBirthday, formatBirthday, formatDaysUntil } from "../lib/birthdays";
import { WishCard } from "../components/WishCard";
import type { Family, UserProfile, Wish } from "../types";

export function MemberWishes() {
  const { familyId, uid } = useParams<{ familyId: string; uid: string }>();
  const { user } = useAuth();

  const [family, setFamily] = useState<Family | null>(null);
  const [member, setMember] = useState<UserProfile | null>(null);
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!familyId || !uid) return;
    Promise.all([
      getFamily(familyId),
      getFamilyMembers([uid]),
      getWishesByOwner(uid),
    ]).then(([f, members, w]) => {
      setFamily(f);
      setMember(members[0] ?? null);
      // Sort: unreserved first, then by priority
      const sorted = [...w].sort((a, b) => {
        if (!!a.reservedBy !== !!b.reservedBy) return a.reservedBy ? 1 : -1;
        return a.priority - b.priority;
      });
      setWishes(sorted);
      setLoading(false);
    });
  }, [familyId, uid]);

  async function handleReserve(wishId: string) {
    if (!user) return;
    await reserveWish(wishId, user.uid);
    setWishes((prev) =>
      prev.map((w) => (w.id === wishId ? { ...w, reservedBy: user.uid } : w))
    );
  }

  async function handleUnreserve(wishId: string) {
    await unreserveWish(wishId);
    setWishes((prev) =>
      prev.map((w) => (w.id === wishId ? { ...w, reservedBy: null } : w))
    );
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-zinc-400">Laster…</div>;
  }

  if (!member) {
    return <div className="p-6 text-center text-zinc-500">Bruker ikke funnet.</div>;
  }

  const bday = member.birthday ? nextBirthday(member.birthday) : null;
  const firstName = member.displayName.split(" ")[0];

  const initials = (member.displayName || "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const myReservations = wishes.filter((w) => w.reservedBy === user?.uid).length;

  return (
    <div className="mx-auto max-w-xl p-6">
      {/* Back nav */}
      <header className="mb-6">
        {family && (
          <Link
            to={`/familie/${familyId}`}
            className="mb-1 block text-sm text-zinc-500 hover:text-zinc-800"
          >
            ← {family.name}
          </Link>
        )}

        {/* Member profile card */}
        <div
          className={`rounded-2xl p-5 ${
            bday?.isToday
              ? "bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300"
              : "bg-gradient-to-r from-fuchsia-50 to-pink-50 border border-fuchsia-100"
          }`}
        >
          <div className="flex items-center gap-4">
            {member.photoURL ? (
              <img
                src={member.photoURL}
                alt=""
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-400 to-pink-400 text-xl font-bold text-white">
                {initials}
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-zinc-900">
                {member.displayName}
                {bday?.isToday && " 🎉"}
              </h1>
              {bday ? (
                <p className="text-sm text-zinc-600">
                  {formatBirthday(member.birthday!)} · fyller {bday.age} år ·{" "}
                  <span className="font-semibold text-fuchsia-700">
                    {formatDaysUntil(bday.daysUntil)}
                  </span>
                </p>
              ) : (
                <p className="text-sm text-zinc-400">Ingen bursdag registrert</p>
              )}
            </div>
          </div>
          {bday?.isToday && (
            <p className="mt-3 rounded-xl bg-yellow-100 px-3 py-2 text-sm font-bold text-yellow-800 text-center">
              🎉 I dag er det {firstName}s bursdag!
            </p>
          )}
        </div>
      </header>

      {/* Summary of my reservations */}
      {myReservations > 0 && (
        <div className="mb-4 rounded-xl bg-green-50 border border-green-200 px-4 py-2.5 text-sm text-green-700">
          🎁 Du har valgt å kjøpe{" "}
          <strong>{myReservations}</strong>{" "}
          {myReservations === 1 ? "gave" : "gaver"} til {firstName}
        </div>
      )}

      {/* Wish list */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-zinc-800">
            {firstName}s ønskeliste
          </h2>
          <span className="text-xs text-zinc-400">{wishes.length} {wishes.length === 1 ? "ønske" : "ønsker"}</span>
        </div>

        {wishes.length === 0 ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <p className="text-4xl mb-3">🎁</p>
            <p className="font-semibold text-zinc-800">Ingen ønsker ennå</p>
            <p className="mt-1 text-sm text-zinc-500">
              {firstName} har ikke lagt til noen ønsker ennå.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {wishes.map((wish) => (
              <WishCard
                key={wish.id}
                wish={wish}
                isOwn={false}
                currentUserId={user?.uid}
                onReserve={handleReserve}
                onUnreserve={handleUnreserve}
              />
            ))}
          </div>
        )}
      </section>

      {/* Hint about secrecy */}
      <p className="mt-6 text-center text-xs text-zinc-400">
        🤫 {firstName} kan ikke se hvem som har kjøpt hva
      </p>
    </div>
  );
}
