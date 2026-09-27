import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAdminCatalog } from "@/hooks/useCatalog";
import { useAuth } from "@/hooks/useAuth";
import { CAT_LABELS, LEAD_LABELS, type Cat, type LeadKey } from "@/data/products";
import { IMAGE_MAP, seedRows, type ShopProduct } from "@/lib/catalog";
import { translateProductCopy } from "@/lib/translate.functions";
import { Card, Empty, Field, Pill, btnGhost, btnPrimary, cadExact, downloadCsv, inputCls } from "@/components/admin/kit";

export const Route = createFileRoute("/_authenticated/admin/products")({
  validateSearch: (search: Record<string, unknown>): { edit?: string | undefined } => ({
    edit: typeof search['edit'] === "string" ? (search['edit'] as string) : undefined,
  }),
  component: ProductsAdmin,
});

const CATS: Cat[] = ["fiestas", "madera", "3d", "postres", "juguetes"];
const LEADS = Object.keys(LEAD_LABELS) as LeadKey[];

interface Draft {
  rowId?: string | undefined;
  slug: string;
  cat: Cat;
  price: string;
  lead: LeadKey;
  dimensions: string;
  rating: string;
  reviewCount: string;
  sortOrder: string;
  stock: string;
  popular: boolean;
  published: boolean;
  imageKey: string;
  imageUrl: string;
  name: { en: string; fr: string; es: string };
  tag: { en: string; fr: string; es: string };
  desc: { en: string; fr: string; es: string };
  material: { en: string; fr: string; es: string };
}

const emptyDraft = (sortOrder = 999): Draft => ({
  slug: "",
  cat: "fiestas",
  price: "0",
  lead: "d23",
  dimensions: "",
  rating: "5",
  reviewCount: "0",
  sortOrder: String(sortOrder),
  stock: "",
  popular: false,
  published: true,
  imageKey: "",
  imageUrl: "",
  name: { en: "", fr: "", es: "" },
  tag: { en: "", fr: "", es: "" },
  desc: { en: "", fr: "", es: "" },
  material: { en: "", fr: "", es: "" },
});

const toDraft = (p: ShopProduct): Draft => ({
  rowId: p.rowId,
  slug: p.id,
  cat: p.cat,
  price: String(p.price),
  lead: p.lead,
  dimensions: p.dimensions,
  rating: String(p.rating),
  reviewCount: String(p.reviewCount),
  sortOrder: String(p.sortOrder),
  stock: p.stock === null ? "" : String(p.stock),
  popular: p.popular,
  published: p.published,
  imageKey: IMAGE_MAP[p.id] ? p.id : "",
  imageUrl: IMAGE_MAP[p.id] ? "" : p.img,
  name: { ...p.name },
  tag: { ...p.tag },
  desc: { ...p.desc },
  material: { ...p.material },
});

const draftToRow = (d: Draft) => ({
  slug: d.slug.trim(),
  cat: d.cat,
  price_cad: Number(d.price) || 0,
  lead: d.lead,
  dimensions: d.dimensions,
  rating: Number(d.rating) || 5,
  review_count: Number(d.reviewCount) || 0,
  sort_order: Number(d.sortOrder) || 0,
  stock: d.stock.trim() === "" ? null : Math.max(0, Number(d.stock) || 0),
  popular: d.popular,
  published: d.published,
  image_key: d.imageKey || null,
  image_url: d.imageUrl || null,
  name_en: d.name.en,
  name_fr: d.name.fr,
  name_es: d.name.es,
  tag_en: d.tag.en,
  tag_fr: d.tag.fr,
  tag_es: d.tag.es,
  desc_en: d.desc.en,
  desc_fr: d.desc.fr,
  desc_es: d.desc.es,
  material_en: d.material.en,
  material_fr: d.material.fr,
  material_es: d.material.es,
});

const slugify = (v: string) =>
  v
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

function ProductsAdmin() {
  const { isAdmin } = useAuth();
  const qc = useQueryClient();
  const { data, isLoading } = useAdminCatalog();
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState<"todos" | Cat>("todos");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { edit } = Route.useSearch();
  const openedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!edit || !isAdmin || !data || openedFor.current === edit) return;
    const found = data.find((p) => p.id === edit || p.rowId === edit);
    if (found) {
      openedFor.current = edit;
      setDraft(toDraft(found));
      setSearch(found.id);
    }
  }, [edit, isAdmin, data]);

  const refresh = () => qc.invalidateQueries({ queryKey: ["catalog"] });

  const nextSortOrder = useMemo(() => {
    const max = Math.max(0, ...(data ?? []).map((p) => p.sortOrder || 0));
    return max + 10;
  }, [data]);

  // AI: write once in any language, get all three plus the slug
  const translate = useServerFn(translateProductCopy);
  const [aiSource, setAiSource] = useState<"es" | "en" | "fr">("es");
  const autofill = useMutation({
    mutationFn: async (d: Draft) => {
      const res = await translate({
        data: {
          source: aiSource,
          cat: d.cat,
          name: d.name[aiSource],
          tag: d.tag[aiSource],
          desc: d.desc[aiSource],
          material: d.material[aiSource],
        },
      });
      return res;
    },
    onSuccess: (res) => {
      setError(null);
      setDraft((prev) =>
        prev
          ? {
              ...prev,
              name: res.name,
              tag: res.tag,
              desc: res.desc,
              material: res.material,
              slug: prev.slug.trim() ? prev.slug : res.slug,
            }
          : prev
      );
    },
    onError: (e: Error) => setError(e.message),
  });

  const save = useMutation({
    mutationFn: async (d: Draft) => {
      const row = draftToRow({ ...d, slug: d.slug.trim() || slugify(d.name.en || d.name.es) });
      if (!row.slug || !row.name_en) throw new Error("El identificador y el nombre en inglés son obligatorios.");
      if (!/^[a-z0-9-]+$/.test(row.slug))
        throw new Error("El identificador solo admite minúsculas, números y guiones.");
      const clash = (data ?? []).some((p) => p.id === row.slug && p.rowId !== d.rowId);
      if (clash) throw new Error("Ya existe un producto con ese identificador.");
      const res = d.rowId
        ? await supabase.from("products").update(row).eq("id", d.rowId)
        : await supabase.from("products").insert(row);
      if (res.error) throw res.error;
    },
    onSuccess: () => {
      setDraft(null);
      setError(null);
      refresh();
    },
    onError: (e: Error) => setError(e.message),
  });

  const togglePublish = useMutation({
    mutationFn: async (p: ShopProduct) => {
      const { error } = await supabase
        .from("products")
        .update({ published: !p.published })
        .eq("id", p.rowId!);
      if (error) throw error;
    },
    onSuccess: refresh,
    onError: (e: Error) => setError(e.message),
  });

  const remove = useMutation({
    mutationFn: async (p: ShopProduct) => {
      const { error } = await supabase.from("products").delete().eq("id", p.rowId!);
      if (error) throw error;
    },
    onSuccess: refresh,
    onError: (e: Error) => setError(e.message),
  });

  // Renumbering: persists 10, 20, 30 … so there is always room in between
  const applyOrder = async (rows: ShopProduct[]) => {
    const updates = rows.map((p, i) => ({ rowId: p.rowId!, sort_order: (i + 1) * 10 }));
    for (const u of updates) {
      const { error } = await supabase.from("products").update({ sort_order: u.sort_order }).eq("id", u.rowId);
      if (error) throw error;
    }
  };

  const move = useMutation({
    mutationFn: async ({ rows, from, to }: { rows: ShopProduct[]; from: number; to: number }) => {
      if (to < 0 || to >= rows.length) return;
      const next = [...rows];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item!);
      await applyOrder(next);
    },
    onSuccess: refresh,
    onError: (e: Error) => setError(e.message),
  });

  const setPosition = useMutation({
    mutationFn: async ({ p, value }: { p: ShopProduct; value: number }) => {
      const { error } = await supabase.from("products").update({ sort_order: value }).eq("id", p.rowId!);
      if (error) throw error;
    },
    onSuccess: refresh,
    onError: (e: Error) => setError(e.message),
  });

  const renumber = useMutation({
    mutationFn: async () => applyOrder(list),
    onSuccess: refresh,
    onError: (e: Error) => setError(e.message),
  });

  const importSeed = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("products").upsert(seedRows(), { onConflict: "slug" });
      if (error) throw error;
    },
    onSuccess: refresh,
    onError: (e: Error) => setError(e.message),
  });

  const list = useMemo(() => {
    let rows = data ?? [];
    if (cat !== "todos") rows = rows.filter((p) => p.cat === cat);
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter((p) => (p.id + p.name.en + p.name.es).toLowerCase().includes(q));
    }
    return rows;
  }, [data, cat, search]);

  return (
    <div className="grid gap-5">
      <Card
        title="Catálogo"
        action={
          isAdmin ? (
            <div className="flex flex-wrap gap-2">
              <button onClick={() => importSeed.mutate()} disabled={importSeed.isPending} className={btnGhost}>
                {importSeed.isPending ? "Importando…" : "Importar catálogo inicial (25)"}
              </button>
              <button
                onClick={() =>
                  downloadCsv(
                    "catalogo-jac-design.csv",
                    ["orden", "slug", "categoria", "precio_cad", "publicado", "stock", "nombre_en", "nombre_es"],
                    (data ?? []).map((p) => [p.sortOrder, p.id, p.cat, p.price, p.published ? "si" : "no", p.stock ?? "", p.name.en, p.name.es])
                  )
                }
                className={btnGhost}
              >
                Exportar CSV
              </button>
              <button onClick={() => renumber.mutate()} disabled={renumber.isPending} className={btnGhost}>
                {renumber.isPending ? "Numerando…" : "Renumerar 10, 20, 30…"}
              </button>
              <button onClick={() => setDraft(emptyDraft(nextSortOrder))} className={btnPrimary}>
                + Nuevo producto
              </button>
            </div>
          ) : (
            <Pill>Solo lectura</Pill>
          )
        }
      >
        <div className="mb-4 flex flex-wrap gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o identificador"
            className={`${inputCls} sm:max-w-xs`}
          />
          <select value={cat} onChange={(e) => setCat(e.target.value as Cat | "todos")} className={`${inputCls} sm:max-w-xs`}>
            <option value="todos">Todas las categorías</option>
            {CATS.map((c) => (
              <option key={c} value={c}>
                {CAT_LABELS[c].es}
              </option>
            ))}
          </select>
        </div>

        {error && <p className="mb-3 text-xs font-semibold text-rose-600">{error}</p>}

        {isLoading ? (
          <Empty>Cargando catálogo…</Empty>
        ) : list.length === 0 ? (
          <Empty>
            No hay productos en la base todavía. Usa “Importar catálogo inicial” para cargar los 25 productos
            de la tienda y editarlos desde aquí.
          </Empty>
        ) : (
          <ul className="grid gap-2">
            {list.map((p, i) => (
              <li key={p.rowId ?? p.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-border p-2.5">
                <div className="flex items-center gap-1.5">
                  <span className="grid h-7 w-7 place-items-center rounded-xl bg-muted text-[11px] font-black text-muted-foreground">
                    {i + 1}
                  </span>
                  {isAdmin && (
                    <div className="grid gap-0.5">
                      <button
                        onClick={() => move.mutate({ rows: list, from: i, to: i - 1 })}
                        disabled={i === 0 || move.isPending}
                        title="Subir"
                        className="rounded-md border border-border px-1.5 text-[10px] leading-4 disabled:opacity-30 hover:bg-muted"
                      >
                        ▲
                      </button>
                      <button
                        onClick={() => move.mutate({ rows: list, from: i, to: i + 1 })}
                        disabled={i === list.length - 1 || move.isPending}
                        title="Bajar"
                        className="rounded-md border border-border px-1.5 text-[10px] leading-4 disabled:opacity-30 hover:bg-muted"
                      >
                        ▼
                      </button>
                    </div>
                  )}
                </div>
                <img src={p.img} alt="" loading="lazy" className="h-14 w-14 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{p.name.es || p.name.en}</p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {p.id} · {CAT_LABELS[p.cat].es} · {cadExact(p.price)}
                  </p>
                </div>
                {isAdmin && (
                  <label className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
                    N.º
                    <input
                      type="number"
                      defaultValue={p.sortOrder}
                      key={`ord-${p.rowId}-${p.sortOrder}`}
                      onBlur={(e) => {
                        const value = Number(e.target.value);
                        if (Number.isFinite(value) && value !== p.sortOrder) setPosition.mutate({ p, value });
                      }}
                      className="w-16 rounded-xl border border-border bg-background px-2 py-1 text-xs font-bold text-foreground"
                    />
                  </label>
                )}
                {p.stock !== null && (
                  <Pill tone={p.stock === 0 ? "warn" : p.stock <= 3 ? "info" : "muted"}>
                    {p.stock === 0 ? "Sin stock" : `${p.stock} en stock`}
                  </Pill>
                )}
                <Pill tone={p.published ? "ok" : "warn"}>{p.published ? "Publicado" : "Oculto"}</Pill>
                {isAdmin && (
                  <div className="flex gap-2">
                    <button onClick={() => togglePublish.mutate(p)} className="rounded-2xl border border-border px-3 py-2 text-xs font-semibold hover:bg-muted">
                      {p.published ? "Ocultar" : "Publicar"}
                    </button>
                    <button onClick={() => setDraft(toDraft(p))} className="rounded-2xl border border-border px-3 py-2 text-xs font-semibold hover:bg-muted">
                      Editar
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`¿Borrar “${p.name.es || p.name.en}”?`)) remove.mutate(p);
                      }}
                      className="rounded-2xl border border-border px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-muted"
                    >
                      Borrar
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {draft && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-3 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-border bg-card p-6 shadow-soft">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-black">{draft.rowId ? "Editar producto" : "Nuevo producto"}</h2>
              <button onClick={() => setDraft(null)} className={btnGhost}>
                Cerrar
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Identificador (slug) — automático si lo dejas vacío">
                <input value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Categoría">
                <select value={draft.cat} onChange={(e) => setDraft({ ...draft, cat: e.target.value as Cat })} className={inputCls}>
                  {CATS.map((c) => (
                    <option key={c} value={c}>
                      {CAT_LABELS[c].es}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Precio (CAD)">
                <input type="number" step="0.01" value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Plazo de entrega">
                <select value={draft.lead} onChange={(e) => setDraft({ ...draft, lead: e.target.value as LeadKey })} className={inputCls}>
                  {LEADS.map((l) => (
                    <option key={l} value={l}>
                      {LEAD_LABELS[l].es}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Medidas">
                <input value={draft.dimensions} onChange={(e) => setDraft({ ...draft, dimensions: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Orden en la tienda">
                <input type="number" value={draft.sortOrder} onChange={(e) => setDraft({ ...draft, sortOrder: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Inventario (vacío = sin control)">
                <input
                  type="number"
                  min="0"
                  value={draft.stock}
                  onChange={(e) => setDraft({ ...draft, stock: e.target.value })}
                  className={inputCls}
                />
              </Field>
              <Field label="Calificación (1-5)">
                <input type="number" step="0.1" value={draft.rating} onChange={(e) => setDraft({ ...draft, rating: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Número de reseñas">
                <input type="number" value={draft.reviewCount} onChange={(e) => setDraft({ ...draft, reviewCount: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Foto incluida en la app">
                <select value={draft.imageKey} onChange={(e) => setDraft({ ...draft, imageKey: e.target.value })} className={inputCls}>
                  <option value="">— usar enlace de foto —</option>
                  {Object.keys(IMAGE_MAP).map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Enlace de foto (https)">
                <input value={draft.imageUrl} onChange={(e) => setDraft({ ...draft, imageUrl: e.target.value })} className={inputCls} />
              </Field>
            </div>

            <div className="mt-4 flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input type="checkbox" checked={draft.published} onChange={(e) => setDraft({ ...draft, published: e.target.checked })} />
                Publicado en la tienda
              </label>
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input type="checkbox" checked={draft.popular} onChange={(e) => setDraft({ ...draft, popular: e.target.checked })} />
                Destacado / más vendido
              </label>
            </div>

            <div className="mt-5 rounded-2xl border border-amber-500/40 bg-amber-500/5 p-4">
              <p className="text-sm font-bold">Redacción automática trilingüe</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Escribe el nombre y la descripción en un solo idioma; la IA completa los otros dos, mejora el texto y
                genera el identificador si está vacío.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <select value={aiSource} onChange={(e) => setAiSource(e.target.value as "es" | "en" | "fr")} className={`${inputCls} sm:max-w-[180px]`}>
                  <option value="es">Escribí en español</option>
                  <option value="en">I wrote in English</option>
                  <option value="fr">J’ai écrit en français</option>
                </select>
                <button
                  onClick={() => autofill.mutate(draft)}
                  disabled={autofill.isPending}
                  className={btnPrimary}
                >
                  {autofill.isPending ? "Traduciendo…" : "Completar los 3 idiomas con IA"}
                </button>
              </div>
            </div>

            {(["name", "tag", "desc", "material"] as const).map((key) => (
              <div key={key} className="mt-5 grid gap-3 sm:grid-cols-3">
                {(["en", "fr", "es"] as const).map((l) => (
                  <Field key={l} label={`${labels[key]} (${l.toUpperCase()})`}>
                    {key === "desc" ? (
                      <textarea
                        rows={3}
                        value={draft[key][l]}
                        onChange={(e) => setDraft({ ...draft, [key]: { ...draft[key], [l]: e.target.value } })}
                        className={inputCls}
                      />
                    ) : (
                      <input
                        value={draft[key][l]}
                        onChange={(e) => setDraft({ ...draft, [key]: { ...draft[key], [l]: e.target.value } })}
                        className={inputCls}
                      />
                    )}
                  </Field>
                ))}
              </div>
            ))}

            {error && <p className="mt-4 text-xs font-semibold text-rose-600">{error}</p>}

            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setDraft(null)} className={btnGhost}>
                Cancelar
              </button>
              <button onClick={() => save.mutate(draft)} disabled={save.isPending} className={btnPrimary}>
                {save.isPending ? "Guardando…" : "Guardar producto"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const labels: Record<"name" | "tag" | "desc" | "material", string> = {
  name: "Nombre",
  tag: "Etiqueta",
  desc: "Descripción",
  material: "Material",
};
