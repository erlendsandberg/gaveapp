import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getFamilyMembers } from "../lib/families";
import {
  getWishesByReserver,
  markAsPurchased,
  unmarkAsPurchased,
  unreserveWish,
} from "../lib/wishes";
import { nextBirthday, formatBirthday, formatDaysUntil } from "../lib/birthdays";
import { WishCard } from "../components/WishCard";
import type { UserProfile, Wish } from "../types";

type Group = {
  owner: UserProfile;
  wishes: Wish[];
};

export function MyReservations() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getWishesByReserver(user.uid)
      .then(async (wishes) => {
        if (wishes.length === 0) { setGroups([]); return; }
        const ownerIds = [...new Set(wishes.map((w) => w.ownerId))];
        const owners = await getFamilyMembers(ownerIds);
        const ownerMap = Object.fromEntries(owners.map((o) => [o.uid, o]));
        // Sorter grupper: de med kjøpsdato nærmest bursdag (ikke kjøpt) først
        const sorted = ownerIds
          .filter((id) => ownerMap[id])
          .map((id) => ({
            owner: ownerMap[id],
            wishes: wishes.filter((w) => w.ownerId === id),
          }))
          .sort((a, b) => {
            const bdA = a.owner.birthday ? nextBirthday(a.owner.birthday).daysUntil : 999;
            const bdB = b.owner.birthday ? nextBirthday(b.owner.birthday).daysUntil : 999;
            return bdA - bdB;
          });
        setGroups(sorted);
      })
      .catch((err) => console.error("MyReservations load error:", err))
      .finally(() => setLoading(false));
  }, [user]);

  function updateWish(wishId: string, updates: Partial<Wish>) {
    setGroups((prev) =>
      prev.map((g) => ({
        ...g,
        wishes: g.wishes.map((w) => (w.id === wishId ? { ...w, ...updates } : w)),
      }))
    );
  }

  function removeWish(wishId: string) {
    setGroups((prev) =>
      prev
        .map((g) => ({ ...g, wishes: g.wishes.filter((w) => w.id !== wishId) }))
        .filter((g) => g.wishes.length > 0)
    );
  }

  async function handleMarkPurchased(wishId: string) {
    await markAsPurchased(wishId);
    updateWish(wishId, { purchased: true });
  }

  async function handleUnmarkPurchased(wishId: string) {
    await unmarkAsPurchased(wishId);
    updateWish(wishId, { purchased: false });
  }

  async function handleUnreserve(wishId: string) {
    await unreserveWish(wishId);
    removeWish(wishId);
  }

  const totalCount = groups.reduce((n, g) => n + g.wishes.length, 0);
  const purchasedCount = groups.reduce(
    (n, g) => n + g.wishes.filter((w) => w.purchased).length,
    0
  );

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-zinc-400">Laster…</div>;
  }

  return (
    <div className="mx-auto max-w-xl p-6">
      <header className="mb-6">
        <Link to="/" className="mb-1 block text-sm text-zinc-500 hover:text-zinc-800">
          ← Hjem
        </Link>
        <div className="flex items-end justify-between">
          <h1 className="text-2xl font-bold text-zinc-900">Mine reservasjoner 🛍️</h1>
          {totalCount > 0 && (
            <span className="text-sm text-zinc-500">
              {purchasedCount}/{totalCount} kjøpt
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-zinc-500">
          Gaver du har sagt du kjøper — bare du ser denne listen.
        </p>
      </header>

      {groups.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
          <p className="text-4xl mb-3">🛍️</p>
          <p className="font-semibold text-zinc-800">Ingen reservasjoner ennå</p>
          <p className="mt-1 text-sm text-zinc-500">
            Gå inn på en ønskeliste og trykk "Jeg kjøper!" for å reservere en gave.
          </p>
          <Link
            to="/familier"
            className="mt-4 inline-block rounded-xl bg-fuchsia-600 px-5 py-2 font-semibold text-white hover:bg-fuchsia-700"
          >
            Se familier
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map(({ owner, wishes }) => {
            const bday = owner.birthday ? nextBirthday(owner.birthday) : null;
            const firstName = owner.displayName.split(" ")[0];
            const purchased = wishes.filter((w) => w.purchased).length;
            const initials = (owner.displayName || "?")
              .split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

            return (
              <section key={owner.uid}>
                {/* Recipient header */}
                <Link
                  to={`/bruker/${owner.uid}`}
                  className="mb-3 flex items-center gap-3 rounded-2xl bg-gradient-to-r from-fuchsia-50 to-pink-50 border border-fuchsia-100 px-4 py-3 hover:border-fuchsia-300 transition group"
                >
                  {owner.photoURL ? (
                    <img src={owner.photoURL} alt="" className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-400 to-pink-400 font-bold text-white text-sm">
                      {initials}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-zinc-900 group-hover:text-fuchsia-700">
                      {owner.displayName}
                    </p>
                    {bday && (
                      <p className="text-xs text-zinc-500">
                        {formatBirthday(owner.birthday!)} ·{" "}
                        <span className={bday.isToday ? "font-semibold text-orange-600" : bday.isSoon ? "font-semibold text-fuchsia-600" : ""}>
                          {formatDaysUntil(bday.daysUntil)}
                        </span>
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-400">{purchased}/{wishes.length} kjøpt</span>
                    <span className="text-zinc-300 group-hover:text-fuchsia-400">→</span>
                  </div>
                </Link>

                {/* Wish cards */}
                <div className="space-y-2">
                  {wishes.map((wish) => (
                    <WishCard
                      key={wish.id}
                      wish={wish}
                      isOwn={false}
                      currentUserId={user?.uid}
                      onMarkPurchased={handleMarkPurchased}
                      onUnmarkPurchased={handleUnmarkPurchased}
                      onUnreserve={handleUnreserve}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
