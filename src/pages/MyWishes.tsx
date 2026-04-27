import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  addWish,
  updateWish,
  deleteWish,
  getWishesByOwner,
  type WishInput,
} from "../lib/wishes";
import { WishCard } from "../components/WishCard";
import { WishForm, EMPTY_WISH } from "../components/WishForm";
import type { Wish } from "../types";

export function MyWishes() {
  const { user } = useAuth();
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingWish, setEditingWish] = useState<Wish | null>(null);

  useEffect(() => {
    if (!user) return;
    getWishesByOwner(user.uid).then((w) => {
      setWishes(w);
      setLoading(false);
    });
  }, [user]);

  async function handleAdd(input: WishInput) {
    if (!user) return;
    const id = await addWish(user.uid, input);
    const newWish: Wish = { id, ownerId: user.uid, ...input, reservedBy: null };
    setWishes((prev) => [...prev, newWish]);
    setShowForm(false);
  }

  async function handleEdit(input: WishInput) {
    if (!editingWish) return;
    await updateWish(editingWish.id, input);
    setWishes((prev) =>
      prev.map((w) => (w.id === editingWish.id ? { ...w, ...input } : w))
    );
    setEditingWish(null);
  }

  async function handleDelete(wishId: string) {
    await deleteWish(wishId);
    setWishes((prev) => prev.filter((w) => w.id !== wishId));
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-zinc-400">Laster…</div>;
  }

  return (
    <div className="mx-auto max-w-xl p-6">
      <header className="mb-6">
        <Link to="/" className="mb-1 block text-sm text-zinc-500 hover:text-zinc-800">
          ← Hjem
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-zinc-900">Mine ønsker 🎁</h1>
          {!showForm && !editingWish && (
            <button
              onClick={() => setShowForm(true)}
              className="rounded-xl bg-fuchsia-600 px-4 py-2 text-sm font-semibold text-white hover:bg-fuchsia-700"
            >
              + Nytt ønske
            </button>
          )}
        </div>
        <p className="mt-1 text-sm text-zinc-500">
          Disse ønskene kan familien din se — men ikke hvem som har kjøpt hva 🤫
        </p>
      </header>

      {showForm && (
        <div className="mb-6">
          <WishForm
            initial={EMPTY_WISH}
            onSave={handleAdd}
            onCancel={() => setShowForm(false)}
            submitLabel="Legg til"
            heading="Nytt ønske"
          />
        </div>
      )}

      {editingWish && (
        <div className="mb-6">
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

      {wishes.length === 0 && !showForm ? (
        <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
          <p className="text-4xl mb-3">🎁</p>
          <p className="font-semibold text-zinc-800">Ingen ønsker ennå</p>
          <p className="mt-1 text-sm text-zinc-500">
            Legg til det du ønsker deg, så vet familien hva de skal kjøpe!
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 rounded-xl bg-fuchsia-600 px-5 py-2 font-semibold text-white hover:bg-fuchsia-700"
          >
            + Legg til første ønske
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {wishes.map((wish) => (
            <WishCard
              key={wish.id}
              wish={wish}
              isOwn={true}
              currentUserId={user?.uid}
              onEdit={(w) => {
                setShowForm(false);
                setEditingWish(w);
              }}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {wishes.length > 0 && !showForm && !editingWish && (
        <button
          onClick={() => setShowForm(true)}
          className="mt-6 w-full rounded-2xl border-2 border-dashed border-fuchsia-200 py-3 text-sm font-medium text-fuchsia-500 hover:border-fuchsia-400 hover:text-fuchsia-700 transition"
        >
          + Legg til et ønske
        </button>
      )}
    </div>
  );
}
