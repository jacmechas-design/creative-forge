import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/i18n";
import type { Tri } from "@/i18n/lang";
import {
  SERVICE_LABELS,
  type PortfolioItem,
  type PortfolioMedia,
  type PortfolioService,
} from "@/lib/portfolio";

const T = {
  all: { en: "All", fr: "Tout", es: "Todo" },
  photos: { en: "photos", fr: "photos", es: "fotos" },
  video: { en: "Video", fr: "Vidéo", es: "Video" },
  quote: { en: "Quote one like this", fr: "Un devis pour ceci", es: "Cotizar uno así" },
  close: { en: "Close", fr: "Fermer", es: "Cerrar" },
  prev: { en: "Previous", fr: "Précédent", es: "Anterior" },
  next: { en: "Next", fr: "Suivant", es: "Siguiente" },
  seeMore: { en: "See the post", fr: "Voir la publication", es: "Ver publicación" },
} satisfies Record<string, Tri>;

function MediaThumb({ m, alt }: { m: PortfolioMedia; alt: string }) {
  if (m.type === "video") {
    return (
      <video
        src={`${m.url}#t=0.1`}
        muted
        playsInline
        preload="metadata"
        aria-label={alt}
        className="h-full w-full object-cover"
      />
    );
  }
  return (
    <img
      src={m.url}
      alt={alt}
      loading="lazy"
      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
    />
  );
}

export function PortfolioGallery({
  items,
  showFilters = true,
  onQuote,
}: {
  items: PortfolioItem[];
  showFilters?: boolean;
  onQuote?: (item: PortfolioItem) => void;
}) {
  const { tr } = useI18n();
  const [filter, setFilter] = useState<"todos" | PortfolioService>("todos");
  const [open, setOpen] = useState<{ item: PortfolioItem; index: number } | null>(null);

  const services = useMemo(() => [...new Set(items.map((i) => i.service))], [items]);
  const shown = filter === "todos" ? items : items.filter((i) => i.service === filter);

  // Keyboard: Esc closes, arrows move between photos/videos of the open project.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      const n = open.item.media.length;
      if (e.key === "ArrowRight" && n > 1) setOpen({ ...open, index: (open.index + 1) % n });
      if (e.key === "ArrowLeft" && n > 1) setOpen({ ...open, index: (open.index - 1 + n) % n });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      {showFilters && services.length > 1 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {(["todos", ...services] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              aria-pressed={filter === s}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                filter === s
                  ? "bg-foreground text-background"
                  : "border border-border bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              {s === "todos" ? tr(T.all) : tr(SERVICE_LABELS[s])}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
        {shown.map((item) => {
          const cover = item.media[0];
          const videos = item.media.filter((m) => m.type === "video").length;
          return (
            <article
              key={item.id}
              className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft sm:rounded-3xl"
            >
              <button
                onClick={() => setOpen({ item, index: 0 })}
                className="relative aspect-square w-full overflow-hidden bg-muted"
                aria-label={item.title}
                disabled={!cover}
              >
                {cover && <MediaThumb m={cover} alt={item.title} />}
                <div className="absolute bottom-2 left-2 flex gap-1.5">
                  {videos > 0 && (
                    <span className="flex items-center gap-1 rounded-full bg-black/65 px-2.5 py-1 text-[11px] font-bold text-white">
                      <svg
                        viewBox="0 0 24 24"
                        className="h-3 w-3"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path d="M8 5v14l11-7z" />
                      </svg>
                      {tr(T.video)}
                    </span>
                  )}
                  {item.media.length > 1 && (
                    <span className="rounded-full bg-black/65 px-2.5 py-1 text-[11px] font-bold text-white">
                      {item.media.length} {tr(T.photos)}
                    </span>
                  )}
                </div>
              </button>
              <div className="flex flex-1 flex-col gap-1 p-3 sm:p-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary sm:text-[11px]">
                  {tr(SERVICE_LABELS[item.service])}
                </span>
                <h3 className="line-clamp-2 text-sm font-bold leading-snug sm:text-base">
                  {item.title}
                </h3>
                {item.description && (
                  <p className="hidden text-xs leading-relaxed text-muted-foreground sm:line-clamp-2">
                    {item.description}
                  </p>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/85 p-3 backdrop-blur-sm sm:p-6"
          onClick={() => setOpen(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={open.item.title}
            onClick={(e) => e.stopPropagation()}
            className="grid max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-3xl bg-card shadow-2xl lg:grid-cols-[1.6fr_1fr]"
          >
            <div className="relative grid min-h-[40vh] place-items-center bg-black">
              {(() => {
                const m = open.item.media[open.index];
                if (!m) return null;
                return m.type === "video" ? (
                  <video
                    key={m.url}
                    src={m.url}
                    controls
                    autoPlay
                    playsInline
                    className="max-h-[70vh] w-full object-contain"
                  />
                ) : (
                  <img
                    key={m.url}
                    src={m.url}
                    alt={open.item.title}
                    className="max-h-[70vh] w-full object-contain"
                  />
                );
              })()}
              {open.item.media.length > 1 && (
                <>
                  <button
                    onClick={() =>
                      setOpen({
                        ...open,
                        index: (open.index - 1 + open.item.media.length) % open.item.media.length,
                      })
                    }
                    aria-label={tr(T.prev)}
                    className="absolute left-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-xl font-bold text-black"
                  >
                    ‹
                  </button>
                  <button
                    onClick={() =>
                      setOpen({ ...open, index: (open.index + 1) % open.item.media.length })
                    }
                    aria-label={tr(T.next)}
                    className="absolute right-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-xl font-bold text-black"
                  >
                    ›
                  </button>
                  <span className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs font-bold text-white">
                    {open.index + 1} / {open.item.media.length}
                  </span>
                </>
              )}
            </div>
            <div className="flex flex-col gap-3 p-5 sm:p-6">
              <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                {tr(SERVICE_LABELS[open.item.service])}
              </span>
              <h3 className="text-xl font-black tracking-tight sm:text-2xl">{open.item.title}</h3>
              {open.item.description && (
                <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                  {open.item.description}
                </p>
              )}
              {open.item.media.length > 1 && (
                <div className="flex flex-wrap gap-2">
                  {open.item.media.map((m, i) => (
                    <button
                      key={m.path}
                      onClick={() => setOpen({ ...open, index: i })}
                      aria-label={`${i + 1}`}
                      className={`h-14 w-14 overflow-hidden rounded-xl border-2 ${i === open.index ? "border-primary" : "border-transparent"}`}
                    >
                      <MediaThumb m={m} alt="" />
                    </button>
                  ))}
                </div>
              )}
              <div className="mt-auto flex flex-wrap gap-2 pt-3">
                {onQuote && (
                  <button
                    onClick={() => {
                      onQuote(open.item);
                      setOpen(null);
                    }}
                    className="rounded-2xl bg-gradient-warm px-5 py-2.5 text-sm font-bold text-rose-foreground shadow-soft"
                  >
                    {tr(T.quote)}
                  </button>
                )}
                {open.item.external_url && (
                  <a
                    href={open.item.external_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-2xl border border-border px-5 py-2.5 text-sm font-bold hover:bg-muted"
                  >
                    {tr(T.seeMore)}
                  </a>
                )}
                <button
                  onClick={() => setOpen(null)}
                  className="rounded-2xl border border-border px-5 py-2.5 text-sm font-semibold hover:bg-muted"
                >
                  {tr(T.close)}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
