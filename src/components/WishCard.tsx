import type { Wish } from "../types";
import { PRIORITY_LABEL, PRIORITY_COLOR } from "../lib/wishes";

interface WishCardProps {
  wish: Wish;
  /** True når innlogget bruker ser sin egen ønskeliste */
  isOwn: boolean;
  currentUserId?: string;
  onEdit?: (wish: Wish) => void;
  onDelete?: (wishId: string) => void;
  onReserve?: (wishId: string) => void;
  onUnreserve?: (wishId: string) => void;
  onMarkPurchased?: (wishId: string) => void;
  onUnmarkPurchased?: (wishId: string) => void;
}

export function WishCard({
  wish,
  isOwn,
  currentUserId,
  onEdit,
  onDelete,
  onReserve,
  onUnreserve,
  onMarkPurchased,
  onUnmarkPurchased,
}: WishCardProps) {
  const isReservedByMe = wish.reservedBy === currentUserId;
  const isReservedByOther = !!wish.reservedBy && !isReservedByMe;
  const isPurchased = !!wish.purchased;

  return (
    <div className={`rounded-2xl border p-4 shadow-sm transition ${
      isPurchased && isReservedByMe
        ? "border-green-200 bg-green-50"
        : isReservedByMe
        ? "border-fuchsia-100 bg-fuchsia-50/40"
        : isReservedByOther
        ? "border-zinc-100 bg-white opacity-60"
        : "border-zinc-100 bg-white"
    }`}>
      <div className="flex items-start gap-3">
        {/* Priority badge */}
        <div className={`mt-0.5 flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${PRIORITY_COLOR[wish.priority]}`}>
          {PRIORITY_LABEL[wish.priority]}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={`font-semibold leading-snug ${isPurchased && isReservedByMe ? "line-through text-zinc-400" : "text-zinc-900"}`}>
            {wish.title}
          </p>

          {wish.note && (
            <p className="mt-0.5 text-xs text-zinc-500 line-clamp-2">{wish.note}</p>
          )}

          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            {wish.price !== undefined && wish.price !== null && (
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
                {wish.price.toLocaleString("nb-NO")} kr
              </span>
            )}
            {wish.url && (
              <a
                href={wish.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-fuchsia-50 px-2 py-0.5 text-xs font-medium text-fuchsia-600 hover:bg-fuchsia-100"
                onClick={(e) => e.stopPropagation()}
              >
                Se lenke →
              </a>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-shrink-0 flex-col items-end gap-2">
          {isOwn ? (
            /* ── Eget kort: rediger / slett ── */
            <>
              {onEdit && (
                <button
                  onClick={() => onEdit(wish)}
                  className="rounded-lg border border-zinc-200 px-2.5 py-1 text-xs text-zinc-500 hover:bg-zinc-50"
                >
                  Rediger
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => { if (confirm(`Slett "${wish.title}"?`)) onDelete(wish.id); }}
                  className="rounded-lg border border-red-100 px-2.5 py-1 text-xs text-red-400 hover:bg-red-50"
                >
                  Slett
                </button>
              )}
            </>
          ) : (
            /* ── Andres kort: reserver / kjøpt ── */
            <>
              {/* Ikke reservert */}
              {!wish.reservedBy && onReserve && (
                <button
                  onClick={() => onReserve(wish.id)}
                  className="rounded-lg bg-fuchsia-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-fuchsia-700"
                >
                  Jeg kjøper! 🎁
                </button>
              )}

              {/* Reservert av meg */}
              {isReservedByMe && !isPurchased && (
                <>
                  <span className="rounded-full bg-fuchsia-100 px-2 py-0.5 text-xs font-semibold text-fuchsia-700">
                    ✓ Reservert
                  </span>
                  {onMarkPurchased && (
                    <button
                      onClick={() => onMarkPurchased(wish.id)}
                      className="rounded-lg bg-green-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-green-700"
                    >
                      Kjøpt ✅
                    </button>
                  )}
                  {onUnreserve && (
                    <button
                      onClick={() => onUnreserve(wish.id)}
                      className="rounded-lg border border-zinc-200 px-2.5 py-1 text-xs text-zinc-400 hover:bg-zinc-50"
                    >
                      Angre
                    </button>
                  )}
                </>
              )}

              {/* Kjøpt av meg */}
              {isReservedByMe && isPurchased && (
                <>
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                    ✅ Kjøpt!
                  </span>
                  {onUnmarkPurchased && (
                    <button
                      onClick={() => onUnmarkPurchased(wish.id)}
                      className="rounded-lg border border-zinc-200 px-2.5 py-1 text-xs text-zinc-400 hover:bg-zinc-50"
                    >
                      Angre
                    </button>
                  )}
                </>
              )}

              {/* Reservert av andre */}
              {isReservedByOther && (
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-500">
                  {isPurchased ? "Kjøpt ✅" : "Tatt"}
                </span>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
