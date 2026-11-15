import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card, Empty, Field, Pill, btnGhost, btnPrimary, inputCls } from "@/components/admin/kit";
import { useAuth } from "@/hooks/useAuth";
import {
  IMAGE_TYPES,
  VIDEO_TYPES,
  portfolioTable,
  removePortfolioMedia,
  uploadPortfolioMedia,
  useAdminPortfolio,
  type PortfolioItem,
  type PortfolioMedia,
  type PortfolioService,
} from "@/lib/portfolio";

export const Route = createFileRoute("/_authenticated/admin/portfolio")({
  head: () => ({
    meta: [
      { title: "Portafolio | JTP" },
      {
        name: "description",
        content: "Sube fotos y videos de tus trabajos para el portafolio público de JTP.",
      },
    ],
  }),
  component: PortfolioAdmin,
});

const SERVICES: { id: PortfolioService; label: string }[] = [
  { id: "uv", label: "Impresión UV" },
  { id: "laser", label: "Corte / grabado láser" },
  { id: "3d", label: "Impresión 3D" },
  { id: "otro", label: "Otro" },
];

type Draft = {
  id: string | null;
  title: string;
  description: string;
  service: PortfolioService;
  external_url: string;
  media: PortfolioMedia[];
  published: boolean;
  featured: boolean;
};

const emptyDraft = (): Draft => ({
  id: null,
  title: "",
  description: "",
  service: "uv",
  external_url: "",
  media: [],
  published: true,
  featured: false,
});

function Thumb({ m }: { m: PortfolioMedia }) {
  return m.type === "video" ? (
    <video
      src={`${m.url}#t=0.1`}
      muted
      playsInline
      preload="metadata"
      className="h-full w-full object-cover"
    />
  ) : (
    <img src={m.url} alt="" className="h-full w-full object-cover" />
  );
}

function PortfolioAdmin() {
  const { isStaff } = useAuth();
  const qc = useQueryClient();
  const { data: items = [], isLoading, error: loadError } = useAdminPortfolio();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [uploading, setUploading] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  // Files uploaded during this edit that were never saved get cleaned up on cancel.
  const [fresh, setFresh] = useState<string[]>([]);

  const refresh = () => qc.invalidateQueries({ queryKey: ["portfolio"] });

  const startEdit = (item?: PortfolioItem) => {
    setError(null);
    setFresh([]);
    setDraft(
      item
        ? {
            id: item.id,
            title: item.title,
            description: item.description,
            service: item.service,
            external_url: item.external_url ?? "",
            media: item.media,
            published: item.published,
            featured: item.featured,
          }
        : emptyDraft(),
    );
  };

  const cancel = async () => {
    await removePortfolioMedia(fresh);
    setFresh([]);
    setDraft(null);
  };

  const addFiles = async (files: FileList | null) => {
    if (!files || !draft) return;
    setError(null);
    for (const file of Array.from(files)) {
      setUploading((u) => [...u, file.name]);
      try {
        const m = await uploadPortfolioMedia(file);
        setDraft((d) => (d ? { ...d, media: [...d.media, m] } : d));
        setFresh((f) => [...f, m.path]);
      } catch (e) {
        setError(`${file.name}: ${(e as Error).message}`);
      } finally {
        setUploading((u) => u.filter((n) => n !== file.name));
      }
    }
  };

  const moveMedia = (i: number, dir: -1 | 1) =>
    setDraft((d) => {
      if (!d) return d;
      const j = i + dir;
      if (j < 0 || j >= d.media.length) return d;
      const media = [...d.media];
      [media[i], media[j]] = [media[j]!, media[i]!];
      return { ...d, media };
    });

  const save = async () => {
    if (!draft) return;
    if (!draft.title.trim()) return setError("Ponle un título al trabajo.");
    if (draft.media.length === 0) return setError("Sube al menos una foto o un video.");
    if (draft.external_url && !/^https:\/\//.test(draft.external_url))
      return setError("El enlace debe empezar con https://");
    setSaving(true);
    setError(null);
    const row = {
      title: draft.title.trim(),
      description: draft.description.trim(),
      service: draft.service,
      external_url: draft.external_url.trim() || null,
      media: draft.media,
      published: draft.published,
      featured: draft.featured,
    };
    try {
      if (draft.id) {
        const before = items.find((i) => i.id === draft.id);
        const { error: e } = await portfolioTable().update(row).eq("id", draft.id);
        if (e) throw new Error(e.message);
        // Delete files the user removed from this project.
        const kept = new Set(draft.media.map((m) => m.path));
        await removePortfolioMedia(
          (before?.media ?? []).map((m) => m.path).filter((p) => !kept.has(p)),
        );
      } else {
        const minOrder = items.reduce((m, i) => Math.min(m, i.sort_order), 0);
        const { error: e } = await portfolioTable()
          .insert({ ...row, sort_order: minOrder - 1 })
          .select("id")
          .single();
        if (e) throw new Error(e.message);
      }
      setFresh([]);
      setDraft(null);
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (item: PortfolioItem, field: "published" | "featured") => {
    const { error: e } = await portfolioTable()
      .update({ [field]: !item[field] })
      .eq("id", item.id);
    if (e) setError(e.message);
    await refresh();
  };

  const move = async (index: number, dir: -1 | 1) => {
    const j = index + dir;
    if (j < 0 || j >= items.length) return;
    // Rewrite sort_order for the whole list so the order is explicit and stable.
    const order = [...items];
    [order[index], order[j]] = [order[j]!, order[index]!];
    await Promise.all(
      order.map((it, k) => portfolioTable().update({ sort_order: k }).eq("id", it.id)),
    );
    await refresh();
  };

  const remove = async (item: PortfolioItem) => {
    const { error: e } = await portfolioTable().delete().eq("id", item.id);
    if (e) return setError(e.message);
    await removePortfolioMedia(item.media.map((m) => m.path));
    setConfirmDelete(null);
    await refresh();
  };

  if (!isStaff) return <Empty>Solo el equipo puede administrar el portafolio.</Empty>;

  if (draft) {
    return (
      <Card title={draft.id ? "Editar trabajo" : "Nuevo trabajo"}>
        <div className="grid gap-5">
          <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
            <Field label="Título">
              <input
                id="pf-title"
                value={draft.title}
                maxLength={160}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                placeholder="Ej. 12 coasters de madera con logo para café"
                className={inputCls}
              />
            </Field>
            <Field label="Servicio">
              <select
                id="pf-service"
                value={draft.service}
                onChange={(e) =>
                  setDraft({ ...draft, service: e.target.value as PortfolioService })
                }
                className={inputCls}
              >
                {SERVICES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Descripción (opcional)">
            <textarea
              id="pf-desc"
              rows={3}
              maxLength={4000}
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              placeholder="Material, medida, para quién fue, qué se personalizó…"
              className={inputCls}
            />
          </Field>

          <div className="grid gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Fotos y videos · la primera es la portada
            </span>
            {draft.media.length > 0 && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                {draft.media.map((m, i) => (
                  <div key={m.path} className="overflow-hidden rounded-2xl border border-border">
                    <div className="relative aspect-square bg-muted">
                      <Thumb m={m} />
                      {i === 0 && (
                        <span className="absolute left-1.5 top-1.5 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-bold text-white">
                          Portada
                        </span>
                      )}
                      {m.type === "video" && (
                        <span className="absolute bottom-1.5 left-1.5 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-bold text-white">
                          Video
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-1 p-1.5 text-xs">
                      <button
                        onClick={() => moveMedia(i, -1)}
                        disabled={i === 0}
                        className="rounded-lg px-2 py-1 hover:bg-muted disabled:opacity-30"
                        aria-label="Mover a la izquierda"
                      >
                        ←
                      </button>
                      <button
                        onClick={() =>
                          setDraft({ ...draft, media: draft.media.filter((_, k) => k !== i) })
                        }
                        className="rounded-lg px-2 py-1 font-semibold text-rose-600 hover:bg-muted"
                      >
                        Quitar
                      </button>
                      <button
                        onClick={() => moveMedia(i, 1)}
                        disabled={i === draft.media.length - 1}
                        className="rounded-lg px-2 py-1 hover:bg-muted disabled:opacity-30"
                        aria-label="Mover a la derecha"
                      >
                        →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <label className="grid cursor-pointer place-items-center gap-1 rounded-2xl border-2 border-dashed border-border p-6 text-center hover:bg-muted/50">
              <span className="text-sm font-bold">+ Subir fotos o videos</span>
              <span className="text-xs text-muted-foreground">
                JPG, PNG o WEBP hasta 10 MB · MP4, WEBM o MOV hasta 50 MB · puedes elegir varios
              </span>
              <input
                id="pf-files"
                type="file"
                multiple
                accept={[...IMAGE_TYPES, ...VIDEO_TYPES].join(",")}
                onChange={(e) => {
                  void addFiles(e.target.files);
                  e.target.value = "";
                }}
                className="sr-only"
              />
            </label>
            {uploading.length > 0 && (
              <p className="text-xs font-semibold text-primary">
                Subiendo: {uploading.join(", ")}…
              </p>
            )}
          </div>

          <Field label="Enlace a la publicación en Instagram o Facebook (opcional)">
            <input
              id="pf-link"
              type="url"
              value={draft.external_url}
              onChange={(e) => setDraft({ ...draft, external_url: e.target.value })}
              placeholder="https://www.instagram.com/p/…"
              className={inputCls}
            />
          </Field>

          <div className="flex flex-wrap gap-5 text-sm">
            <label className="flex items-center gap-2">
              <input
                id="pf-pub"
                type="checkbox"
                checked={draft.published}
                onChange={(e) => setDraft({ ...draft, published: e.target.checked })}
              />
              Publicado (visible para clientes)
            </label>
            <label className="flex items-center gap-2">
              <input
                id="pf-feat"
                type="checkbox"
                checked={draft.featured}
                onChange={(e) => setDraft({ ...draft, featured: e.target.checked })}
              />
              Destacado (aparece primero en la página de inicio)
            </label>
          </div>

          {error && (
            <p className="rounded-2xl bg-rose-500/10 px-4 py-2.5 text-sm font-semibold text-rose-700 dark:text-rose-400">
              {error}
            </p>
          )}

          <div className="flex flex-wrap justify-end gap-2">
            <button onClick={() => void cancel()} className={btnGhost} disabled={saving}>
              Cancelar
            </button>
            <button
              onClick={() => void save()}
              className={btnPrimary}
              disabled={saving || uploading.length > 0}
            >
              {saving ? "Guardando…" : "Guardar trabajo"}
            </button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card
      title="Portafolio"
      action={
        <div className="flex flex-wrap gap-2">
          <Link to="/portfolio" target="_blank" className={btnGhost}>
            Ver página pública
          </Link>
          <button onClick={() => startEdit()} className={btnPrimary}>
            + Nuevo trabajo
          </button>
        </div>
      }
    >
      <p className="mb-4 text-sm text-muted-foreground">
        Sube fotos y videos de tus trabajos terminados. Los publicados aparecen en <b>/portfolio</b>{" "}
        y los más recientes o destacados en la página de inicio.
      </p>
      {error && <p className="mb-3 text-sm font-semibold text-rose-600">{error}</p>}
      {loadError ? (
        <Empty>
          No se pudo cargar el portafolio. Si es la primera vez, falta aplicar la migración{" "}
          <code>20261114210000_portfolio.sql</code> desde Lovable.
        </Empty>
      ) : isLoading ? (
        <Empty>Cargando…</Empty>
      ) : items.length === 0 ? (
        <Empty>Aún no hay trabajos. Sube el primero con “+ Nuevo trabajo”.</Empty>
      ) : (
        <ul className="grid gap-2">
          {items.map((item, i) => (
            <li
              key={item.id}
              className="flex flex-wrap items-center gap-3 rounded-2xl border border-border p-3"
            >
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                {item.media[0] && <Thumb m={item.media[0]} />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">{item.title}</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  <Pill tone="info">{SERVICES.find((s) => s.id === item.service)?.label}</Pill>
                  <Pill>
                    {item.media.filter((m) => m.type === "image").length} fotos ·{" "}
                    {item.media.filter((m) => m.type === "video").length} videos
                  </Pill>
                  {item.published ? (
                    <Pill tone="ok">Publicado</Pill>
                  ) : (
                    <Pill tone="warn">Oculto</Pill>
                  )}
                  {item.featured && <Pill tone="info">Destacado</Pill>}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => void move(i, -1)}
                  disabled={i === 0}
                  className="rounded-xl border border-border px-2.5 py-2 text-xs disabled:opacity-30"
                  aria-label="Subir en el orden"
                >
                  ↑
                </button>
                <button
                  onClick={() => void move(i, 1)}
                  disabled={i === items.length - 1}
                  className="rounded-xl border border-border px-2.5 py-2 text-xs disabled:opacity-30"
                  aria-label="Bajar en el orden"
                >
                  ↓
                </button>
                <button
                  onClick={() => void toggle(item, "published")}
                  className="rounded-xl border border-border px-3 py-2 text-xs font-semibold hover:bg-muted"
                >
                  {item.published ? "Ocultar" : "Publicar"}
                </button>
                <button
                  onClick={() => void toggle(item, "featured")}
                  className="rounded-xl border border-border px-3 py-2 text-xs font-semibold hover:bg-muted"
                >
                  {item.featured ? "Quitar destacado" : "Destacar"}
                </button>
                <button
                  onClick={() => startEdit(item)}
                  className="rounded-xl border border-border px-3 py-2 text-xs font-semibold hover:bg-muted"
                >
                  Editar
                </button>
                {confirmDelete === item.id ? (
                  <button
                    onClick={() => void remove(item)}
                    className="rounded-xl bg-rose-600 px-3 py-2 text-xs font-bold text-white"
                  >
                    Confirmar borrar
                  </button>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(item.id)}
                    className="rounded-xl border border-border px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-muted"
                  >
                    Borrar
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
