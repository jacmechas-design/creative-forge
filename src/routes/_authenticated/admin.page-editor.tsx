import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Eye, EyeOff, GripVertical, ChevronUp, ChevronDown,
  Type, Palette, Image, Save, RotateCcw, Smartphone,
  Monitor, Tablet, Layers, Settings2, Sparkles, CheckCircle2,
  PanelLeftClose, PanelLeftOpen, AlignLeft, AlignCenter,
  AlignRight, Bold, Italic, Plus, Trash2, ExternalLink
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/page-editor")({
  component: PageEditor,
});

/* ── types ──────────────────────────────────── */
interface Section {
  id: string;
  type: "hero" | "catalog" | "quoter" | "reviews" | "services" | "contact" | "custom";
  title: string;
  visible: boolean;
  locked: boolean;
  props: Record<string, any>;
}

interface PageConfig {
  sections: Section[];
  global: {
    primaryColor: string;
    accentColor: string;
    bgColor: string;
    textColor: string;
    fontFamily: string;
    borderRadius: string;
  };
}

const DEFAULT_SECTIONS: Section[] = [
  {
    id: "hero", type: "hero", title: "Hero / Encabezado", visible: true, locked: false,
    props: {
      heading: "Transformamos tus Ideas en Realidad",
      subheading: "Diseño, impresión 3D, corte láser y soluciones creativas para cualquier proyecto.",
      ctaText: "Ver colecciones",
      ctaLink: "#colecciones",
      overlayOpacity: 60,
      headingSize: "5xl",
      textAlign: "center",
    },
  },
  {
    id: "catalog", type: "catalog", title: "Catálogo / Colecciones", visible: true, locked: false,
    props: {
      heading: "Nuestras Colecciones",
      columns: 4,
      showFilters: true,
      showSearch: true,
      showSort: true,
      cardStyle: "rounded",
    },
  },
  {
    id: "quoter", type: "quoter", title: "Cotizador 3D", visible: true, locked: false,
    props: {
      heading: "Maker Studio · cotizador 3D al instante",
      subheading: "Visualiza la geometría 3D en vivo, sube tu STL para el análisis de volumen, elige materiales e infill y obtén el precio exacto en CAD.",
      kicker: "Studio 3D en tiempo real",
    },
  },
  {
    id: "reviews", type: "reviews", title: "Reseñas / Galería", visible: true, locked: false,
    props: {
      heading: "Lo que dicen nuestros clientes",
      autoplay: true,
      showStars: true,
    },
  },
  {
    id: "services", type: "services", title: "Servicios", visible: true, locked: false,
    props: {
      heading: "Nuestros Servicios",
      layout: "grid",
    },
  },
  {
    id: "contact", type: "contact", title: "Contacto", visible: true, locked: false,
    props: {
      heading: "Contacto",
      showMap: false,
      showPhone: true,
      showEmail: true,
    },
  },
];

const DEFAULT_GLOBAL = {
  primaryColor: "#1e3a8a",
  accentColor: "#f97316",
  bgColor: "#ffffff",
  textColor: "#1f2937",
  fontFamily: "Inter",
  borderRadius: "16px",
};

const FONTS = ["Inter", "Roboto", "Outfit", "Poppins", "Montserrat", "DM Sans", "Playfair Display"];
const VIEWPORT_MAP = { desktop: "100%", tablet: "768px", mobile: "375px" } as const;
type Viewport = keyof typeof VIEWPORT_MAP;

/* ── component ─────────────────────────────── */
function PageEditor() {
  const [config, setConfig] = useState<PageConfig>({ sections: DEFAULT_SECTIONS, global: DEFAULT_GLOBAL });
  const [selectedId, setSelectedId] = useState<string | null>("hero");
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const [leftOpen, setLeftOpen] = useState(true);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"layers" | "global">("layers");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  /* load from DB */
  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from("app_content")
        .select("data")
        .eq("id", "page_layout")
        .single();
      if (data?.data) {
        setConfig((prev) => ({
          sections: data.data.sections ?? prev.sections,
          global: { ...prev.global, ...(data.data.global ?? {}) },
        }));
      }
    })();
  }, []);

  /* persist */
  const persist = useCallback(async () => {
    setSaving(true);
    const { error } = await (supabase as any)
      .from("app_content")
      .upsert({ id: "page_layout", data: config });
    setSaving(false);
    if (error) {
      toast.error("Error al guardar");
      console.error(error);
    } else {
      setDirty(false);
      toast.success("¡Cambios publicados!");
      // also sync to global_settings so the shop renders updated hero text / colors
      await (supabase as any).from("app_content").upsert({
        id: "global_settings",
        data: {
          hero_title: config.sections.find((s) => s.id === "hero")?.props.heading ?? "",
          hero_subtitle: config.sections.find((s) => s.id === "hero")?.props.subheading ?? "",
          primary_color: config.global.primaryColor,
        },
      });
    }
  }, [config]);

  /* helpers */
  const update = useCallback((fn: (draft: PageConfig) => PageConfig) => {
    setConfig((prev) => fn(prev));
    setDirty(true);
  }, []);

  const updateSection = useCallback((id: string, patch: Partial<Section>) => {
    update((c) => ({
      ...c,
      sections: c.sections.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }));
  }, [update]);

  const updateSectionProp = useCallback((id: string, key: string, value: any) => {
    update((c) => ({
      ...c,
      sections: c.sections.map((s) =>
        s.id === id ? { ...s, props: { ...s.props, [key]: value } } : s
      ),
    }));
  }, [update]);

  const moveSection = useCallback((id: string, dir: -1 | 1) => {
    update((c) => {
      const idx = c.sections.findIndex((s) => s.id === id);
      if (idx < 0) return c;
      const target = idx + dir;
      if (target < 0 || target >= c.sections.length) return c;
      const arr = [...c.sections];
      [arr[idx], arr[target]] = [arr[target], arr[idx]];
      return { ...c, sections: arr };
    });
  }, [update]);

  const selected = config.sections.find((s) => s.id === selectedId) ?? null;

  /* ── render ── */
  return (
    <div className="flex h-[calc(100vh-120px)] gap-0 overflow-hidden rounded-2xl border border-border bg-card shadow-soft">

      {/* ─── LEFT PANEL ─── */}
      {leftOpen && (
        <aside className="flex w-72 shrink-0 flex-col border-r border-border bg-gradient-to-b from-card to-muted/30">
          {/* tabs */}
          <div className="flex border-b border-border">
            <button
              onClick={() => setTab("layers")}
              className={`flex-1 px-3 py-3 text-xs font-bold transition-colors ${tab === "layers" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Layers className="mr-1 inline h-3.5 w-3.5" /> Capas
            </button>
            <button
              onClick={() => setTab("global")}
              className={`flex-1 px-3 py-3 text-xs font-bold transition-colors ${tab === "global" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Settings2 className="mr-1 inline h-3.5 w-3.5" /> Global
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {tab === "layers" ? (
              /* ── layers list ── */
              config.sections.map((sec, idx) => (
                <div
                  key={sec.id}
                  onClick={() => setSelectedId(sec.id)}
                  className={`group flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium cursor-pointer transition-all ${
                    selectedId === sec.id
                      ? "bg-gradient-warm text-rose-foreground shadow-md"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  <GripVertical className="h-3.5 w-3.5 shrink-0 opacity-40" />
                  <span className="flex-1 truncate">{sec.title}</span>
                  {/* visibility toggle */}
                  <button
                    onClick={(e) => { e.stopPropagation(); updateSection(sec.id, { visible: !sec.visible }); }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    title={sec.visible ? "Ocultar" : "Mostrar"}
                  >
                    {sec.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}
                  </button>
                  {/* move arrows */}
                  <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                    <button disabled={idx === 0} onClick={(e) => { e.stopPropagation(); moveSection(sec.id, -1); }}>
                      <ChevronUp className="h-3 w-3" />
                    </button>
                    <button disabled={idx === config.sections.length - 1} onClick={(e) => { e.stopPropagation(); moveSection(sec.id, 1); }}>
                      <ChevronDown className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              /* ── global settings ── */
              <div className="space-y-4 pt-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Colores</h4>
                {([
                  ["primaryColor", "Color primario"],
                  ["accentColor", "Color de acento"],
                  ["bgColor", "Fondo"],
                  ["textColor", "Texto"],
                ] as const).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 text-sm">
                    <input
                      type="color"
                      value={(config.global as any)[key]}
                      onChange={(e) => update((c) => ({ ...c, global: { ...c.global, [key]: e.target.value } }))}
                      className="h-8 w-8 shrink-0 cursor-pointer rounded-lg border border-border p-0"
                    />
                    <span className="flex-1">{label}</span>
                    <code className="text-[10px] text-muted-foreground">{(config.global as any)[key]}</code>
                  </label>
                ))}

                <h4 className="pt-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Tipografía</h4>
                <select
                  value={config.global.fontFamily}
                  onChange={(e) => update((c) => ({ ...c, global: { ...c.global, fontFamily: e.target.value } }))}
                  className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm"
                >
                  {FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>

                <h4 className="pt-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Border Radius</h4>
                <input
                  type="range"
                  min="0"
                  max="32"
                  value={parseInt(config.global.borderRadius)}
                  onChange={(e) => update((c) => ({ ...c, global: { ...c.global, borderRadius: e.target.value + "px" } }))}
                  className="w-full"
                />
                <span className="text-xs text-muted-foreground">{config.global.borderRadius}</span>
              </div>
            )}
          </div>

          {/* save button */}
          <div className="border-t border-border p-3 space-y-2">
            <button
              disabled={!dirty || saving}
              onClick={persist}
              className={`flex w-full items-center justify-center gap-2 rounded-2xl py-2.5 text-sm font-bold transition-all ${
                dirty
                  ? "bg-gradient-warm text-rose-foreground shadow-md hover:shadow-lg"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              }`}
            >
              {saving ? <RotateCcw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? "Guardando…" : dirty ? "Publicar Cambios" : "Sin cambios"}
            </button>
          </div>
        </aside>
      )}

      {/* ─── CENTER: PREVIEW ─── */}
      <div className="flex flex-1 flex-col bg-muted/30">
        {/* toolbar */}
        <div className="flex items-center gap-2 border-b border-border bg-card/80 px-4 py-2 backdrop-blur-sm">
          <button onClick={() => setLeftOpen(!leftOpen)} className="rounded-lg p-1.5 hover:bg-muted" title="Toggle panel">
            {leftOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
          </button>
          <div className="mx-auto flex items-center gap-1 rounded-xl bg-muted p-1">
            {([["desktop", Monitor], ["tablet", Tablet], ["mobile", Smartphone]] as const).map(([vp, Ico]) => (
              <button
                key={vp}
                onClick={() => setViewport(vp as Viewport)}
                className={`rounded-lg p-2 transition-colors ${viewport === vp ? "bg-card shadow-sm" : "hover:bg-card/60"}`}
                title={vp}
              >
                <Ico className="h-4 w-4" />
              </button>
            ))}
          </div>
          <a href="/" target="_blank" className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-muted">
            <ExternalLink className="h-3.5 w-3.5" /> Ver Tienda
          </a>
        </div>

        {/* preview canvas */}
        <div className="flex flex-1 items-start justify-center overflow-auto p-6">
          <div
            className="origin-top rounded-xl border border-border bg-white shadow-2xl transition-all duration-300 overflow-hidden"
            style={{ width: VIEWPORT_MAP[viewport], maxWidth: "100%", minHeight: "600px" }}
          >
            {/* Live mini-preview of sections */}
            <div style={{ fontFamily: config.global.fontFamily }}>
              {config.sections.filter((s) => s.visible).map((sec) => (
                <div
                  key={sec.id}
                  onClick={() => setSelectedId(sec.id)}
                  className={`relative cursor-pointer transition-all border-2 ${
                    selectedId === sec.id ? "border-primary" : "border-transparent hover:border-primary/30"
                  }`}
                >
                  {/* section type badge */}
                  {selectedId === sec.id && (
                    <div className="absolute left-2 top-2 z-10 flex items-center gap-1 rounded-lg bg-primary px-2 py-0.5 text-[10px] font-bold text-white shadow-md">
                      <Sparkles className="h-3 w-3" /> {sec.title}
                    </div>
                  )}
                  <SectionPreview section={sec} global={config.global} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── RIGHT PANEL: PROPERTIES ─── */}
      {selected && (
        <aside className="flex w-80 shrink-0 flex-col border-l border-border bg-gradient-to-b from-card to-muted/20 overflow-y-auto">
          <div className="border-b border-border px-4 py-3">
            <h3 className="flex items-center gap-2 text-sm font-bold">
              <Settings2 className="h-4 w-4 text-primary" />
              {selected.title}
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            <SectionProps section={selected} onUpdateProp={(k, v) => updateSectionProp(selected.id, k, v)} />
          </div>
        </aside>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────
   Section-specific property editors
   ──────────────────────────────────────────────── */
function SectionProps({ section, onUpdateProp }: { section: Section; onUpdateProp: (key: string, value: any) => void }) {
  const p = section.props;

  const TextInput = ({ label, propKey, multiline }: { label: string; propKey: string; multiline?: boolean }) => (
    <div>
      <label className="mb-1 block text-xs font-semibold text-muted-foreground">{label}</label>
      {multiline ? (
        <textarea
          rows={3}
          value={p[propKey] ?? ""}
          onChange={(e) => onUpdateProp(propKey, e.target.value)}
          className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      ) : (
        <input
          type="text"
          value={p[propKey] ?? ""}
          onChange={(e) => onUpdateProp(propKey, e.target.value)}
          className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      )}
    </div>
  );

  const ColorInput = ({ label, propKey }: { label: string; propKey: string }) => (
    <label className="flex items-center gap-2 text-sm">
      <input
        type="color"
        value={p[propKey] ?? "#000000"}
        onChange={(e) => onUpdateProp(propKey, e.target.value)}
        className="h-8 w-8 shrink-0 cursor-pointer rounded-lg border border-border p-0"
      />
      <span className="flex-1">{label}</span>
    </label>
  );

  const Toggle = ({ label, propKey }: { label: string; propKey: string }) => (
    <label className="flex items-center gap-2 text-sm cursor-pointer">
      <div
        onClick={() => onUpdateProp(propKey, !p[propKey])}
        className={`relative h-5 w-9 rounded-full transition-colors ${p[propKey] ? "bg-primary" : "bg-muted-foreground/30"}`}
      >
        <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${p[propKey] ? "translate-x-4" : "translate-x-0.5"}`} />
      </div>
      <span>{label}</span>
    </label>
  );

  const SelectInput = ({ label, propKey, options }: { label: string; propKey: string; options: { value: string; label: string }[] }) => (
    <div>
      <label className="mb-1 block text-xs font-semibold text-muted-foreground">{label}</label>
      <select
        value={p[propKey] ?? options[0]?.value}
        onChange={(e) => onUpdateProp(propKey, e.target.value)}
        className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm"
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );

  const RangeInput = ({ label, propKey, min = 0, max = 100 }: { label: string; propKey: string; min?: number; max?: number }) => (
    <div>
      <label className="mb-1 flex items-center justify-between text-xs font-semibold text-muted-foreground">
        <span>{label}</span>
        <span className="text-[10px]">{p[propKey] ?? min}</span>
      </label>
      <input
        type="range"
        min={min}
        max={max}
        value={p[propKey] ?? min}
        onChange={(e) => onUpdateProp(propKey, Number(e.target.value))}
        className="w-full"
      />
    </div>
  );

  switch (section.type) {
    case "hero":
      return (
        <>
          <TextInput label="Título principal" propKey="heading" />
          <TextInput label="Subtítulo" propKey="subheading" multiline />
          <TextInput label="Texto del botón CTA" propKey="ctaText" />
          <TextInput label="Link del CTA" propKey="ctaLink" />
          <SelectInput label="Tamaño del título" propKey="headingSize" options={[
            { value: "3xl", label: "Mediano" },
            { value: "4xl", label: "Grande" },
            { value: "5xl", label: "Extra Grande" },
            { value: "6xl", label: "Enorme" },
          ]} />
          <SelectInput label="Alineación" propKey="textAlign" options={[
            { value: "left", label: "Izquierda" },
            { value: "center", label: "Centro" },
            { value: "right", label: "Derecha" },
          ]} />
          <RangeInput label="Opacidad del overlay" propKey="overlayOpacity" />
          <ColorInput label="Color del título" propKey="headingColor" />
          <ColorInput label="Color del subtítulo" propKey="subheadingColor" />
        </>
      );
    case "catalog":
      return (
        <>
          <TextInput label="Título de la sección" propKey="heading" />
          <SelectInput label="Columnas" propKey="columns" options={[
            { value: "2", label: "2 columnas" },
            { value: "3", label: "3 columnas" },
            { value: "4", label: "4 columnas" },
          ]} />
          <SelectInput label="Estilo de tarjeta" propKey="cardStyle" options={[
            { value: "rounded", label: "Redondeado" },
            { value: "sharp", label: "Cuadrado" },
            { value: "pill", label: "Pastilla" },
          ]} />
          <Toggle label="Mostrar filtros" propKey="showFilters" />
          <Toggle label="Mostrar buscador" propKey="showSearch" />
          <Toggle label="Mostrar ordenamiento" propKey="showSort" />
        </>
      );
    case "quoter":
      return (
        <>
          <TextInput label="Kicker" propKey="kicker" />
          <TextInput label="Título" propKey="heading" />
          <TextInput label="Descripción" propKey="subheading" multiline />
        </>
      );
    case "reviews":
      return (
        <>
          <TextInput label="Título de la sección" propKey="heading" />
          <Toggle label="Autoplay" propKey="autoplay" />
          <Toggle label="Mostrar estrellas" propKey="showStars" />
        </>
      );
    case "services":
      return (
        <>
          <TextInput label="Título de la sección" propKey="heading" />
          <SelectInput label="Disposición" propKey="layout" options={[
            { value: "grid", label: "Grilla" },
            { value: "list", label: "Lista" },
          ]} />
        </>
      );
    case "contact":
      return (
        <>
          <TextInput label="Título de la sección" propKey="heading" />
          <Toggle label="Mostrar teléfono" propKey="showPhone" />
          <Toggle label="Mostrar email" propKey="showEmail" />
          <Toggle label="Mostrar mapa" propKey="showMap" />
        </>
      );
    default:
      return (
        <>
          <TextInput label="Título" propKey="heading" />
          <TextInput label="Contenido" propKey="content" multiline />
        </>
      );
  }
}

/* ────────────────────────────────────────────────
   Mini preview renderers for each section type
   ──────────────────────────────────────────────── */
function SectionPreview({ section, global }: { section: Section; global: PageConfig["global"] }) {
  const p = section.props;
  switch (section.type) {
    case "hero":
      return (
        <div
          className="relative flex min-h-[220px] items-center justify-center overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${global.primaryColor}dd, ${global.accentColor}bb)` }}
        >
          <div className="absolute inset-0 bg-black" style={{ opacity: (p.overlayOpacity ?? 60) / 100 * 0.6 }} />
          <div className="relative z-10 px-8 py-10" style={{ textAlign: p.textAlign || "center" }}>
            <h1
              className={`font-black leading-tight text-${p.headingSize || "5xl"} mb-3`}
              style={{ color: p.headingColor || "#ffffff", fontSize: p.headingSize === "6xl" ? "3rem" : p.headingSize === "5xl" ? "2.4rem" : p.headingSize === "4xl" ? "2rem" : "1.6rem" }}
            >
              {p.heading || "Hero Title"}
            </h1>
            <p className="text-sm max-w-xl mx-auto" style={{ color: p.subheadingColor || "#ffffffcc" }}>
              {p.subheading || "Subtitle goes here"}
            </p>
            {p.ctaText && (
              <div className="mt-5">
                <span
                  className="inline-block rounded-full px-6 py-2.5 text-sm font-bold shadow-lg"
                  style={{ background: global.accentColor, color: "#fff", borderRadius: global.borderRadius }}
                >
                  {p.ctaText}
                </span>
              </div>
            )}
          </div>
        </div>
      );

    case "catalog":
      return (
        <div className="px-6 py-8">
          <h2 className="text-lg font-bold mb-4" style={{ color: global.textColor }}>{p.heading || "Catálogo"}</h2>
          <div className={`grid gap-3`} style={{ gridTemplateColumns: `repeat(${p.columns || 4}, 1fr)` }}>
            {[1, 2, 3, 4].slice(0, Number(p.columns) || 4).map((i) => (
              <div key={i} className="rounded-xl bg-muted/50 border border-border aspect-[3/4] flex items-center justify-center text-xs text-muted-foreground" style={{ borderRadius: global.borderRadius }}>
                Producto {i}
              </div>
            ))}
          </div>
        </div>
      );

    case "quoter":
      return (
        <div className="px-6 py-8 bg-muted/40">
          {p.kicker && <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: global.accentColor }}>{p.kicker}</span>}
          <h2 className="text-lg font-bold mt-1" style={{ color: global.textColor }}>{p.heading || "Cotizador 3D"}</h2>
          <p className="text-xs text-muted-foreground mt-1 max-w-md">{p.subheading}</p>
          <div className="mt-4 flex gap-3">
            <div className="h-32 flex-1 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 border border-border flex items-center justify-center text-xs text-muted-foreground" style={{ borderRadius: global.borderRadius }}>
              Vista 3D
            </div>
            <div className="h-32 w-40 rounded-xl bg-muted border border-border flex items-center justify-center text-xs text-muted-foreground" style={{ borderRadius: global.borderRadius }}>
              Controles
            </div>
          </div>
        </div>
      );

    case "reviews":
      return (
        <div className="px-6 py-8">
          <h2 className="text-lg font-bold mb-4" style={{ color: global.textColor }}>{p.heading || "Reseñas"}</h2>
          <div className="flex gap-3 overflow-hidden">
            {[1, 2, 3].map((i) => (
              <div key={i} className="min-w-[160px] rounded-xl border border-border bg-card p-3" style={{ borderRadius: global.borderRadius }}>
                {p.showStars && <div className="flex gap-0.5 text-amber-400 text-[10px] mb-1">★★★★★</div>}
                <div className="h-2 w-3/4 rounded bg-muted mb-1" />
                <div className="h-2 w-1/2 rounded bg-muted" />
                <p className="mt-2 text-[10px] text-muted-foreground">— Cliente {i}</p>
              </div>
            ))}
          </div>
        </div>
      );

    case "services":
      return (
        <div className="px-6 py-8 bg-muted/30">
          <h2 className="text-lg font-bold mb-4" style={{ color: global.textColor }}>{p.heading || "Servicios"}</h2>
          <div className={`${p.layout === "list" ? "space-y-2" : "grid grid-cols-2 gap-3"}`}>
            {["Impresión 3D", "Corte Láser", "Eventos", "Postres"].map((s) => (
              <div key={s} className="rounded-xl border border-border bg-card p-3 text-xs font-medium" style={{ borderRadius: global.borderRadius }}>
                {s}
              </div>
            ))}
          </div>
        </div>
      );

    case "contact":
      return (
        <div className="px-6 py-8">
          <h2 className="text-lg font-bold mb-4" style={{ color: global.textColor }}>{p.heading || "Contacto"}</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border bg-muted/30 p-3 col-span-2" style={{ borderRadius: global.borderRadius }}>
              <div className="h-2 w-1/3 rounded bg-muted mb-2" />
              <div className="h-8 rounded-lg border border-border bg-card" />
            </div>
            <div className="rounded-xl border border-border bg-muted/30 p-3" style={{ borderRadius: global.borderRadius }}>
              <div className="h-2 w-1/2 rounded bg-muted mb-2" />
              <div className="h-8 rounded-lg border border-border bg-card" />
            </div>
            <div className="rounded-xl border border-border bg-muted/30 p-3" style={{ borderRadius: global.borderRadius }}>
              <div className="h-2 w-1/2 rounded bg-muted mb-2" />
              <div className="h-8 rounded-lg border border-border bg-card" />
            </div>
          </div>
        </div>
      );

    default:
      return (
        <div className="px-6 py-8">
          <h2 className="text-lg font-bold">{p.heading || section.title}</h2>
          <p className="text-xs text-muted-foreground">{p.content}</p>
        </div>
      );
  }
}
