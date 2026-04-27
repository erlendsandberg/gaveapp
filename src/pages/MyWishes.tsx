import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  addWish,
  updateWish,
  deleteWish,
  getWishesByOwner,
  PRIORITY_LABEL,
  PRIORITY_COLOR,
  type WishInput,
} from "../lib/wishes";
import { WishCard } from "../components/WishCard";
import type { Wish } from "../types";

const EMPTY_FORM: WishInput = {
  title: "",
  url: "",
  price: undefined,
  priority: 2,
  note: "",
};

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
        <Link to="/" className="mb-1 block text-sm text-zinc-500 hover:text-zinc-800">← Hjem</Link>
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

      {/* Add form */}
      {showForm && (
        <div className="mb-6">
          <WishForm
            initial={EMPTY_FORM}
            onSave={handleAdd}
            onCancel={() => setShowForm(false)}
            submitLabel="Legg til"
          />
        </div>
      )}

      {/* Edit form */}
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
          />
        </div>
      )}

      {/* Wish list */}
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

/* ─── Wish form ─────────────────────────────────────────────────────────── */

function WishForm({
  initial,
  onSave,
  onCancel,
  submitLabel,
}: {
  initial: WishInput;
  onSave: (input: WishInput) => Promise<void>;
  onCancel: () => void;
  submitLabel: string;
}) {
  const [title, setTitle] = useState(initial.title);
  const [url, setUrl] = useState(initial.url ?? "");
  const [price, setPrice] = useState<string>(
    initial.price !== undefined ? String(initial.price) : ""
  );
  const [priority, setPriority] = useState<1 | 2 | 3>(initial.priority);
  const [note, setNote] = useState(initial.note ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const priceNum = price.trim() ? parseFloat(price.replace(",", ".")) : undefined;
      await onSave({
        title: title.trim(),
        url: url.trim() || undefined,
        price: priceNum,
        priority,
        note: note.trim() || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Noe gikk galt");
      setBusy(false);
    }
  }

  const priorities: Array<{ value: 1 | 2 | 3; emoji: string }> = [
    { value: 1, emoji: "🔴" },
    { value: 2, emoji: "🟡" },
    { value: 3, emoji: "🔵" },
  ];

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl bg-white p-5 shadow-sm border border-fuchsia-100 space-y-4"
    >
      <h2 className="font-semibold text-zinc-900">{submitLabel === "Legg til" ? "Nytt ønske" : "Rediger ønske"}</h2>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-zinc-700">Hva ønsker du deg? *</span>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="F.eks. Airpods, bok, genser..."
          autoFocus
          required
          className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 focus:border-fuchsia-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-100"
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-zinc-700">Pris (kr)</span>
          <input
            type="text"
            inputMode="decimal"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="F.eks. 499"
            className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 focus:border-fuchsia-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-100"
          />
        </label>

        <div>
          <span className="mb-1 block text-sm font-medium text-zinc-700">Prioritet</span>
          <div className="flex gap-2">
            {priorities.map(({ value, emoji }) => (
              <button
                key={value}
                type="button"
                onClick={() => setPriority(value)}
                className={`flex-1 rounded-xl border py-2 text-xs font-semibold transition ${
                  priority === value
                    ? `${PRIORITY_COLOR[value]} border-transparent`
                    : "border-zinc-200 text-zinc-500 hover:bg-zinc-50"
                }`}
              >
                {emoji} {PRIORITY_LABEL[value]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-zinc-700">Lenke (valgfri)</span>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://..."
          className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 focus:border-fuchsia-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-100"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-zinc-700">Kommentar (valgfri)</span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Størrelse, farge, ekstra info..."
          rows={2}
          className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 resize-none focus:border-fuchsia-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-100"
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
          disabled={busy || !title.trim()}
          className="flex-1 rounded-xl bg-fuchsia-600 py-2.5 font-semibold text-white hover:bg-fuchsia-700 disabled:opacity-50"
        >
          {busy ? "Lagrer…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
