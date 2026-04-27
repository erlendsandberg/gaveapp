import { useState } from "react";
import { PRIORITY_LABEL, PRIORITY_COLOR, type WishInput } from "../lib/wishes";

export function WishForm({
  initial,
  onSave,
  onCancel,
  submitLabel = "Lagre",
  heading,
}: {
  initial: WishInput;
  onSave: (input: WishInput) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
  heading?: string;
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
      const priceNum = price.trim()
        ? parseFloat(price.replace(",", "."))
        : undefined;
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
      {heading && <h2 className="font-semibold text-zinc-900">{heading}</h2>}

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-zinc-700">
          Hva ønskes? *
        </span>
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
          <span className="mb-1 block text-sm font-medium text-zinc-700">
            Pris (kr)
          </span>
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
          <span className="mb-1 block text-sm font-medium text-zinc-700">
            Prioritet
          </span>
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
        <span className="mb-1 block text-sm font-medium text-zinc-700">
          Lenke (valgfri)
        </span>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://..."
          className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 focus:border-fuchsia-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-100"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-zinc-700">
          Kommentar (valgfri)
        </span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Størrelse, farge, ekstra info..."
          rows={2}
          className="w-full resize-none rounded-xl border border-zinc-200 px-3 py-2.5 focus:border-fuchsia-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-100"
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

export const EMPTY_WISH: WishInput = {
  title: "",
  url: "",
  price: undefined,
  priority: 2,
  note: "",
};
