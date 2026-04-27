import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getFamily, getFamilyMembers, updateManagedProfile } from "../lib/families";
import {
  getWishesByOwner,
  addWish,
  updateWish,
  deleteWish,
  reserveWish,
  unreserveWish,
  type WishInput,
} from "../lib/wishes";
import { nextBirthday, formatBirthday, formatDaysUntil } from "../lib/birthdays";
import { WishCard } from "../components/WishCard";
import { WishForm, EMPTY_WISH } from "../components/WishForm";
import type { Family, UserProfile, Wish } from "../types";

export function MemberWishes() {
  const { familyId, uid } = useParams<{ familyId?: string; uid: string }>();
  const { user } = useAuth();

  const [family, setFamily] = useState<Family | null>(null);
  const [member, setMember] = useState<UserProfile | null>(null);
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [loading, setLoading] = useState(true);

  // Parent mode state
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingWish, setEditingWish] = useState<Wish | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);

  useEffect(() => {
    if (!uid) return;
    Promise.all([
      familyId ? getFamily(familyId) : Promise.resolve(null),
      getFamilyMembers([uid]),
      getWishesByOwner(uid),
    ]).then(([f, members, w]) => {
      setFamily(f);
      setMember(members[0] ?? null);
      setWishes(sortWishes(w));
      setLoading(false);
    });
  }, [familyId, uid]);

  function sortWishes(w: Wish[]) {
    return [...w].sort((a, b) => {
      // Unreserved first, then by priority
      if (!!a.reservedBy !== !!b.reservedBy) return a.reservedBy ? 1 : -1;
      return a.priority - b.priority;
    });
  }

  // ── Parent CRUD ───────────────────────────────────────────────────────────

  async function handleAdd(input: WishInput) {
    if (!uid) return;
    const id = await addWish(uid, input);
    const newWish: Wish = { id, ownerId: uid, ...input, reservedBy: null };
    setWishes((prev) => sortWishes([...prev, newWish]));
    setShowAddForm(false);
  }

  async function handleEdit(input: WishInput) {
    if (!editingWish) return;
    await updateWish(editingWish.id, input);
    setWishes((prev) =>
      sortWishes(prev.map((w) => (w.id === editingWish.id ? { ...w, ...input } : w)))
    );
    setEditingWish(null);
  }

  async function handleDelete(wishId: string) {
    await deleteWish(wishId);
    setWishes((prev) => prev.filter((w) => w.id !== wishId));
  }

  async function handleSaveProfile(name: string, birthday: string) {
    if (!uid || !member) return;
    await updateManagedProfile(uid, { displayName: name, birthday });
    setMember((m) => m ? { ...m, displayName: name, birthday } : m);
    setEditingProfile(false);
  }

  // ── Family member reservation ─────────────────────────────────────────────

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

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-zinc-400">Laster…</div>;
  }

  if (!member) {
    return <div className="p-6 text-center text-zinc-500">Bruker ikke funnet.</div>;
  }

  const isParent = member.managedBy === user?.uid;
  const bday = member.birthday ? nextBirthday(member.birthday) : null;
  const firstName = member.displayName.split(" ")[0];
  const myReservations = wishes.filter((w) => w.reservedBy === user?.uid).length;

  const initials = (member.displayName || "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="mx-auto max-w-xl p-6">
      {/* Back nav */}
      <Link
        to={family && familyId ? `/familie/${familyId}` : "/"}
        className="mb-4 block text-sm text-zinc-500 hover:text-zinc-800"
      >
        ← {family ? family.name : "Hjem"}
      </Link>

      {/* Member profile card */}
      <div
        className={`mb-6 rounded-2xl p-5 ${
          bday?.isToday
            ? "bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300"
            : "bg-gradient-to-r from-fuchsia-50 to-pink-50 border border-fuchsia-100"
        }`}
      >
        {editingProfile ? (
          <EditProfileForm
            name={member.displayName}
            birthday={member.birthday ?? ""}
            onSave={handleSaveProfile}
            onCancel={() => setEditingProfile(false)}
          />
        ) : (
          <div className="flex items-center gap-4">
            {member.photoURL ? (
              <img
                src={member.photoURL}
                alt=""
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <div className="relative flex-shrink-0">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-400 to-pink-400 text-xl font-bold text-white">
                  {initials}
                </div>
                {member.managedBy && (
                  <span className="absolute -bottom-1 -right-1 text-base">👶</span>
                )}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-zinc-900">
                  {member.displayName}
                  {bday?.isToday && " 🎉"}
                </h1>
                {isParent && (
                  <span className="rounded-full bg-fuchsia-100 px-2 py-0.5 text-xs text-fuchsia-600">
                    ditt barn
                  </span>
                )}
              </div>
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
            {isParent && (
              <button
                onClick={() => setEditingProfile(true)}
                className="flex-shrink-0 rounded-lg border border-zinc-200 bg-white/70 px-2.5 py-1 text-xs text-zinc-500 hover:bg-white"
              >
                Rediger
              </button>
            )}
          </div>
        )}

        {bday?.isToday && !editingProfile && (
          <p className="mt-3 rounded-xl bg-yellow-100 px-3 py-2 text-sm font-bold text-yellow-800 text-center">
            🎉 I dag er det {firstName}s bursdag!
          </p>
        )}
      </div>

      {/* Parent info banner */}
      {isParent && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-fuchsia-50 border border-fuchsia-200 px-4 py-2.5">
          <span className="text-fuchsia-600">🔑</span>
          <p className="text-sm text-fuchsia-700">
            Du administrerer {firstName}s ønskeliste
          </p>
          {!showAddForm && !editingWish && (
            <button
              onClick={() => setShowAddForm(true)}
              className="ml-auto rounded-lg bg-fuchsia-600 px-3 py-1 text-xs font-semibold text-white hover:bg-fuchsia-700"
            >
              + Nytt ønske
            </button>
          )}
        </div>
      )}

      {/* My reservations summary (non-parent) */}
      {!isParent && myReservations > 0 && (
        <div className="mb-4 rounded-xl bg-green-50 border border-green-200 px-4 py-2.5 text-sm text-green-700">
          🎁 Du har valgt å kjøpe{" "}
          <strong>{myReservations}</strong>{" "}
          {myReservations === 1 ? "gave" : "gaver"} til {firstName}
        </div>
      )}

      {/* Add wish form (parent) */}
      {showAddForm && (
        <div className="mb-4">
          <WishForm
            initial={EMPTY_WISH}
            onSave={handleAdd}
            onCancel={() => setShowAddForm(false)}
            submitLabel="Legg til"
            heading={`Nytt ønske for ${firstName}`}
          />
        </div>
      )}

      {/* Edit wish form (parent) */}
      {editingWish && (
        <div className="mb-4">
          <WishForm
            initial={{
              title: editingWish.title,
              url: editingWish.url ?? "",
              price: editingWish.price,
              priority: editingWish.priority,
              note: editingWish.note ?? "",
            }}
            onSave={handleEdit}
            onCancel={() => setEditingWish(null)}
            submitLabel="Lagre endringer"
            heading="Rediger ønske"
          />
        </div>
      )}

      {/* Wish list */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-zinc-800">{firstName}s ønskeliste</h2>
          <span className="text-xs text-zinc-400">
            {wishes.length} {wishes.length === 1 ? "ønske" : "ønsker"}
          </span>
        </div>

        {wishes.length === 0 && !showAddForm ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <p className="text-4xl mb-3">🎁</p>
            <p className="font-semibold text-zinc-800">Ingen ønsker ennå</p>
            <p className="mt-1 text-sm text-zinc-500">
              {isParent
                ? `Legg til ønsker for ${firstName} med knappen over.`
                : `${firstName} har ikke lagt til noen ønsker ennå.`}
            </p>
            {isParent && (
              <button
                onClick={() => setShowAddForm(true)}
                className="mt-4 rounded-xl bg-fuchsia-600 px-5 py-2 font-semibold text-white hover:bg-fuchsia-700"
              >
                + Legg til første ønske
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {wishes.map((wish) => (
              <WishCard
                key={wish.id}
                wish={wish}
                isOwn={isParent}
                currentUserId={user?.uid}
                onEdit={
                  isParent
                    ? (w) => {
                        setShowAddForm(false);
                        setEditingWish(w);
                      }
                    : undefined
                }
                onDelete={isParent ? handleDelete : undefined}
                onReserve={!isParent ? handleReserve : undefined}
                onUnreserve={!isParent ? handleUnreserve : undefined}
              />
            ))}
          </div>
        )}

        {isParent && wishes.length > 0 && !showAddForm && !editingWish && (
          <button
            onClick={() => setShowAddForm(true)}
            className="mt-4 w-full rounded-2xl border-2 border-dashed border-fuchsia-200 py-3 text-sm font-medium text-fuchsia-500 hover:border-fuchsia-400 hover:text-fuchsia-700 transition"
          >
            + Legg til et ønske
          </button>
        )}
      </section>

      {!isParent && (
        <p className="mt-6 text-center text-xs text-zinc-400">
          🤫 {firstName} kan ikke se hvem som har kjøpt hva
        </p>
      )}
    </div>
  );
}

/* ─── Edit profile form (parent) ─────────────────────────────────────────── */

function EditProfileForm({
  name: initialName,
  birthday: initialBirthday,
  onSave,
  onCancel,
}: {
  name: string;
  birthday: string;
  onSave: (name: string, birthday: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initialName);
  const [birthday, setBirthday] = useState(initialBirthday);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !birthday) return;
    setBusy(true);
    await onSave(name.trim(), birthday);
    setBusy(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <h3 className="font-semibold text-zinc-800 text-sm">Rediger barneprofil</h3>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-zinc-600">Navn</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-fuchsia-400 focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-zinc-600">Bursdag</span>
          <input
            type="date"
            value={birthday}
            onChange={(e) => setBirthday(e.target.value)}
            max={new Date().toISOString().split("T")[0]}
            required
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-fuchsia-400 focus:outline-none"
          />
        </label>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-xl border border-zinc-200 py-2 text-xs text-zinc-600 hover:bg-zinc-50"
        >
          Avbryt
        </button>
        <button
          type="submit"
          disabled={busy || !name.trim() || !birthday}
          className="flex-1 rounded-xl bg-fuchsia-600 py-2 text-xs font-semibold text-white hover:bg-fuchsia-700 disabled:opacity-50"
        >
          {busy ? "Lagrer…" : "Lagre"}
        </button>
      </div>
    </form>
  );
}
