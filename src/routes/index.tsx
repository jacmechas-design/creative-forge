import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useI18n, LANGS } from "@/i18n";
import type { Tri } from "@/i18n/lang";
import { CAT_LABELS, type Product } from "@/data/products";
import { useCatalog } from "@/hooks/useCatalog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { submitQuoteRequest } from "@/lib/quotes.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "JTP — Custom UV printing, laser engraving & 3D printing in Edmonton" },
      {
        name: "description",
        content:
          "Personalized tumblers, coasters, signs, keychains and 3D prints made in Edmonton, Alberta. See our work and request a free quote.",
      },
      { property: "og:title", content: "JTP — Custom pieces made in Edmonton" },
      {
        property: "og:description",
        content:
          "UV printing, laser engraving and 3D printing. See our work and request a free quote.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" },
    ],
  }),
  component: Portfolio,
});

/* ── copy ─────────────────────────────────────────────── */

const T = {
  navWork: { en: "Our work", fr: "Réalisations", es: "Trabajos" },
  navServices: { en: "Services", fr: "Services", es: "Servicios" },
  navHow: { en: "How it works", fr: "Fonctionnement", es: "Cómo funciona" },
  navQuote: { en: "Get a quote", fr: "Devis", es: "Cotizar" },
  heroKicker: { en: "Made to order", fr: "Fait sur commande", es: "Hecho por encargo" },
  ctaQuote: {
    en: "Request a free quote",
    fr: "Demander un devis gratuit",
    es: "Pide tu cotización gratis",
  },
  ctaWork: { en: "See our work", fr: "Voir nos réalisations", es: "Ver trabajos" },
  servicesTitle: { en: "What we make", fr: "Ce que nous fabriquons", es: "Lo que hacemos" },
  workTitle: { en: "Recent work", fr: "Réalisations récentes", es: "Trabajos recientes" },
  workText: {
    en: "Every piece is made to order and can be personalized with your name, logo or design.",
    fr: "Chaque pièce est faite sur commande et personnalisable avec votre nom, logo ou design.",
    es: "Cada pieza se hace por encargo y se puede personalizar con tu nombre, logo o diseño.",
  },
  all: { en: "All", fr: "Tout", es: "Todo" },
  from: { en: "from", fr: "à partir de", es: "desde" },
  quoteThis: { en: "Quote one like this", fr: "Un devis pour ceci", es: "Cotizar uno así" },
  details: { en: "Details", fr: "Détails", es: "Ver detalle" },
  emptyWork: {
    en: "Photos of our latest pieces are coming soon. Meanwhile, tell us your idea and we'll quote it.",
    fr: "Les photos de nos dernières pièces arrivent bientôt. En attendant, décrivez votre idée et nous vous ferons un devis.",
    es: "Pronto verás aquí fotos de nuestros trabajos. Mientras tanto, cuéntanos tu idea y te la cotizamos.",
  },
  emptyWorkAdmin: {
    en: "Admin: publish products with photos in Catalog to show them here.",
    fr: "Admin : publiez des produits avec photos dans le Catalogue pour les afficher ici.",
    es: "Admin: publica productos con fotos en Catálogo para que aparezcan aquí.",
  },
  howTitle: { en: "How it works", fr: "Comment ça marche", es: "Cómo funciona" },
  quoteTitle: { en: "Request your quote", fr: "Demandez votre devis", es: "Pide tu cotización" },
  quoteText: {
    en: "Tell us what you have in mind. We'll reply by email with the price, timing and a digital proof before anything is made.",
    fr: "Dites-nous ce que vous imaginez. Nous répondons par courriel avec le prix, le délai et une épreuve numérique avant de fabriquer.",
    es: "Cuéntanos qué tienes en mente. Te respondemos por correo con el precio, el tiempo de entrega y una prueba digital antes de fabricar.",
  },
  fName: { en: "Your name", fr: "Votre nom", es: "Tu nombre" },
  fEmail: { en: "Email", fr: "Courriel", es: "Correo" },
  fPhone: {
    en: "Phone or Instagram (optional)",
    fr: "Téléphone ou Instagram (facultatif)",
    es: "Teléfono o Instagram (opcional)",
  },
  fService: { en: "What do you need?", fr: "De quoi avez-vous besoin ?", es: "¿Qué necesitas?" },
  fDesc: { en: "Describe your idea", fr: "Décrivez votre idée", es: "Describe tu idea" },
  fDescPh: {
    en: "E.g. 12 wooden coasters with our café logo, round, about 4 in.",
    fr: "Ex. 12 sous-verres en bois avec le logo de notre café, ronds, environ 4 po.",
    es: "Ej.: 12 coasters de madera con el logo de mi café, redondos, de unas 4 pulgadas.",
  },
  fQty: { en: "Quantity", fr: "Quantité", es: "Cantidad" },
  fDate: { en: "Needed by (optional)", fr: "Pour le (facultatif)", es: "Para cuándo (opcional)" },
  fBudget: { en: "Budget (optional)", fr: "Budget (facultatif)", es: "Presupuesto (opcional)" },
  fFile: {
    en: "Logo, photo or file (optional)",
    fr: "Logo, photo ou fichier (facultatif)",
    es: "Logo, foto o archivo (opcional)",
  },
  fFileHint: {
    en: "PNG, JPG, WEBP, PDF or STL · max 5 MB",
    fr: "PNG, JPG, WEBP, PDF ou STL · 5 Mo max.",
    es: "PNG, JPG, WEBP, PDF o STL · máx. 5 MB",
  },
  fRef: { en: "Based on", fr: "Basé sur", es: "Basado en" },
  send: { en: "Send request", fr: "Envoyer la demande", es: "Enviar solicitud" },
  sending: { en: "Sending…", fr: "Envoi…", es: "Enviando…" },
  doneTitle: { en: "Request received", fr: "Demande reçue", es: "Solicitud recibida" },
  doneText: {
    en: "Thanks! We'll review your idea and email you the quote. Your reference number is",
    fr: "Merci ! Nous étudions votre idée et vous enverrons le devis par courriel. Votre numéro de référence est",
    es: "¡Gracias! Revisaremos tu idea y te enviaremos la cotización por correo. Tu número de referencia es",
  },
  another: {
    en: "Send another request",
    fr: "Envoyer une autre demande",
    es: "Enviar otra solicitud",
  },
  errRequired: {
    en: "Please add your name, a valid email and a short description (10+ characters).",
    fr: "Ajoutez votre nom, un courriel valide et une courte description (10 caractères min.).",
    es: "Escribe tu nombre, un correo válido y una descripción corta (mínimo 10 caracteres).",
  },
  errFile: {
    en: "That file can't be attached. Use PNG, JPG, WEBP, PDF or STL up to 5 MB, or send it later by email.",
    fr: "Ce fichier ne peut pas être joint. Utilisez PNG, JPG, WEBP, PDF ou STL jusqu'à 5 Mo, ou envoyez-le plus tard par courriel.",
    es: "No se puede adjuntar ese archivo. Usa PNG, JPG, WEBP, PDF o STL de hasta 5 MB, o envíalo después por correo.",
  },
  errSend: {
    en: "We couldn't send your request. Please try again, or contact us directly.",
    fr: "Impossible d'envoyer la demande. Réessayez ou contactez-nous directement.",
    es: "No pudimos enviar tu solicitud. Intenta de nuevo o escríbenos directamente.",
  },
  contactTitle: { en: "Contact", fr: "Contact", es: "Contacto" },
  location: { en: "Location", fr: "Emplacement", es: "Ubicación" },
  pickup: {
    en: "Local pickup in Edmonton. Shipping across Canada on request.",
    fr: "Ramassage local à Edmonton. Expédition au Canada sur demande.",
    es: "Recoge en Edmonton. Envíos dentro de Canadá a pedido.",
  },
  prices: {
    en: "Prices in Canadian dollars (CAD).",
    fr: "Prix en dollars canadiens (CAD).",
    es: "Precios en dólares canadienses (CAD).",
  },
  admin: { en: "Admin access", fr: "Accès admin", es: "Acceso admin" },
  close: { en: "Close", fr: "Fermer", es: "Cerrar" },
  language: { en: "Language", fr: "Langue", es: "Idioma" },
} satisfies Record<string, Tri>;

type ServiceId = "uv" | "laser" | "3d" | "otro";

const SERVICES: { id: Exclude<ServiceId, "otro">; title: Tri; text: Tri; examples: Tri }[] = [
  {
    id: "uv",
    title: { en: "UV printing", fr: "Impression UV", es: "Impresión UV" },
    text: {
      en: "Full-colour photos, logos and names printed directly on almost any surface.",
      fr: "Photos, logos et noms en couleur imprimés directement sur presque toute surface.",
      es: "Fotos, logos y nombres a todo color impresos directamente sobre casi cualquier superficie.",
    },
    examples: {
      en: "Tumblers · coasters · keychains · signs · apparel",
      fr: "Gobelets · sous-verres · porte-clés · enseignes · vêtements",
      es: "Tumblers · coasters · llaveros · letreros · camisetas",
    },
  },
  {
    id: "laser",
    title: {
      en: "Laser cutting & engraving",
      fr: "Découpe et gravure laser",
      es: "Corte y grabado láser",
    },
    text: {
      en: "Precise cuts and engravings in wood for gifts, décor and events.",
      fr: "Découpes et gravures précises sur bois pour cadeaux, déco et événements.",
      es: "Cortes y grabados precisos en madera para regalos, decoración y eventos.",
    },
    examples: {
      en: "Name signs · ornaments · cake toppers · wedding favours",
      fr: "Enseignes · ornements · décorations de gâteau · souvenirs de mariage",
      es: "Letreros con nombre · adornos · toppers · recuerdos de boda",
    },
  },
  {
    id: "3d",
    title: { en: "3D printing", fr: "Impression 3D", es: "Impresión 3D" },
    text: {
      en: "Custom pieces and small batches in PLA and PETG, from your idea or your STL file.",
      fr: "Pièces sur mesure et petites séries en PLA et PETG, à partir de votre idée ou fichier STL.",
      es: "Piezas a medida y pequeñas series en PLA y PETG, desde tu idea o tu archivo STL.",
    },
    examples: {
      en: "Planters · figures · organizers · replacement parts",
      fr: "Pots · figurines · organisateurs · pièces de rechange",
      es: "Macetas · figuras · organizadores · repuestos",
    },
  },
];

const SERVICE_OPTIONS: { id: ServiceId; label: Tri }[] = [
  ...SERVICES.map((s) => ({ id: s.id as ServiceId, label: s.title })),
  {
    id: "otro",
    label: { en: "Other / not sure", fr: "Autre / je ne sais pas", es: "Otro / no estoy seguro" },
  },
];

const STEPS: { title: Tri; text: Tri }[] = [
  {
    title: { en: "Tell us your idea", fr: "Décrivez votre idée", es: "Cuéntanos tu idea" },
    text: {
      en: "Use the form, Instagram or Marketplace. A photo or logo helps.",
      fr: "Par le formulaire, Instagram ou Marketplace. Une photo ou un logo aide.",
      es: "Por el formulario, Instagram o Marketplace. Una foto o logo ayuda.",
    },
  },
  {
    title: { en: "Get price & proof", fr: "Prix et épreuve", es: "Recibe precio y prueba" },
    text: {
      en: "We send the price, timing and a digital mockup to approve.",
      fr: "Nous envoyons le prix, le délai et une maquette numérique à approuver.",
      es: "Te enviamos el precio, el tiempo de entrega y una maqueta digital para aprobar.",
    },
  },
  {
    title: { en: "Approve & confirm", fr: "Approuvez et confirmez", es: "Apruebas y confirmas" },
    text: {
      en: "Once you approve the design, we confirm the order and start making it.",
      fr: "Une fois le design approuvé, nous confirmons la commande et commençons la fabrication.",
      es: "Cuando apruebas el diseño, confirmamos el pedido y empezamos a fabricarlo.",
    },
  },
  {
    title: { en: "Pick up or ship", fr: "Ramassage ou envoi", es: "Recoge o te lo enviamos" },
    text: {
      en: "Pick up in Edmonton or we ship it to you.",
      fr: "Ramassage à Edmonton ou expédition.",
      es: "Recógelo en Edmonton o te lo enviamos.",
    },
  },
];

/** Guess the service a catalog category belongs to, to pre-fill the form. */
const CAT_SERVICE: Record<string, ServiceId> = { madera: "laser", "3d": "3d", juguetes: "3d" };

interface Settings {
  brand_name: string;
  hero_title: string;
  hero_subtitle: string;
  primary_color: string;
  contact_email: string;
  contact_phone: string;
  location: string;
  instagram_url: string;
  facebook_url: string;
}

const DEFAULT_SETTINGS: Settings = {
  brand_name: "JTP",
  hero_title: "Custom pieces, made in Edmonton",
  hero_subtitle: "UV printing, laser engraving and 3D printing for gifts, events and businesses.",
  primary_color: "#1e3a8a",
  contact_email: "",
  contact_phone: "",
  location: "Edmonton, AB",
  instagram_url: "",
  facebook_url: "",
};

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  service: "uv" as ServiceId,
  description: "",
  qty: 1,
  neededBy: "",
  budget: "",
  reference: "",
  website: "",
};

const MAX_FILE = 5 * 1024 * 1024;
const FILE_TYPES = ["image/png", "image/jpeg", "image/webp", "application/pdf"];

/** Reads one JSON document from the `app_content` table (not in the generated DB types). */
type ContentClient = {
  from: (table: string) => {
    select: (cols: string) => {
      eq: (
        col: string,
        v: string,
      ) => { maybeSingle: () => PromiseLike<{ data: { data: unknown } | null }> };
    };
  };
};
async function loadContent<T>(id: string): Promise<T | null> {
  const client = supabase as unknown as ContentClient;
  const { data } = await client.from("app_content").select("data").eq("id", id).maybeSingle();
  return (data?.data as T) ?? null;
}

const readBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1] ?? "");
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });

/* ── page ─────────────────────────────────────────────── */

function Portfolio() {
  const { tr, money, lang, setLang } = useI18n();
  const { products, fromDatabase } = useCatalog();
  const { isAdmin } = useAuth();

  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [categories, setCategories] = useState<{ id: string; label: string }[]>([]);
  const [cat, setCat] = useState("todos");
  const [detail, setDetail] = useState<Product | null>(null);
  const [langOpen, setLangOpen] = useState(false);

  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [doneCode, setDoneCode] = useState<string | null>(null);

  useEffect(() => {
    void loadContent<Partial<Settings>>("global_settings").then((d) => {
      if (d) setSettings((s) => ({ ...s, ...d }));
    });
    void loadContent<{ id: string; label: string }[]>("categories").then((d) => {
      if (Array.isArray(d)) setCategories(d);
    });
  }, []);

  // Only real, published products from the admin catalog are shown; never the bundled demo data.
  const work = useMemo(() => (fromDatabase ? products : []), [fromDatabase, products]);
  const usedCats = useMemo(() => {
    const ids = new Set(work.map((p) => p.cat as string));
    return categories.filter((c) => ids.has(c.id));
  }, [work, categories]);
  const shown = cat === "todos" ? work : work.filter((p) => p.cat === cat);
  const catLabel = (id: string) =>
    categories.find((c) => c.id === id)?.label ??
    (CAT_LABELS as Record<string, Tri>)[id]?.[lang] ??
    id;

  const quoteFrom = (p: Product) => {
    setForm((f) => ({
      ...f,
      reference: tr(p.name),
      service: CAT_SERVICE[p.cat as string] ?? f.service,
    }));
    setDetail(null);
    setDoneCode(null);
    document.getElementById("cotizar")?.scrollIntoView({ behavior: "smooth" });
  };

  const submit = async () => {
    setError("");
    if (
      form.name.trim().length < 2 ||
      !/^\S+@\S+\.\S+$/.test(form.email.trim()) ||
      form.description.trim().length < 10
    ) {
      setError(tr(T.errRequired));
      return;
    }
    let filePayload: { name: string; type: string; base64: string } | null = null;
    if (file) {
      const isStl = file.name.toLowerCase().endsWith(".stl");
      if (file.size > MAX_FILE || (!isStl && !FILE_TYPES.includes(file.type))) {
        setError(tr(T.errFile));
        return;
      }
      filePayload = {
        name: file.name,
        type: isStl ? "model/stl" : file.type,
        base64: await readBase64(file),
      };
    }
    setSending(true);
    try {
      const res = await submitQuoteRequest({
        data: { ...form, qty: Math.max(1, Math.round(form.qty || 1)), lang, file: filePayload },
      });
      setDoneCode(res.code);
      setForm(emptyForm);
      setFile(null);
    } catch (e) {
      setError(String((e as Error)?.message).includes("file_") ? tr(T.errFile) : tr(T.errSend));
    } finally {
      setSending(false);
    }
  };

  const nav: [string, Tri][] = [
    ["#trabajos", T.navWork],
    ["#servicios", T.navServices],
    ["#como-funciona", T.navHow],
  ];
  const input =
    "w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-amber";
  const label = "text-[11px] font-bold uppercase tracking-wider text-muted-foreground";
  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <style>{`
        :root, .dark { --primary: ${settings.primary_color}; --ring: ${settings.primary_color}; }
        .bg-gradient-warm { background: linear-gradient(135deg, ${settings.primary_color}, #3b82f6); }
        .text-amber-600 { color: ${settings.primary_color}; }
      `}</style>
      <div className="min-h-screen bg-background text-foreground">
        {/* NAV */}
        <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 lg:px-8">
            <a href="#inicio" className="flex min-w-0 items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-warm text-sm font-black text-rose-foreground shadow-soft">
                {settings.brand_name.slice(0, 3).toUpperCase()}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-lg font-extrabold tracking-tight">
                  {settings.brand_name}
                </span>
                <span className="block truncate text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  {settings.location}
                </span>
              </span>
            </a>
            <div className="flex items-center gap-2">
              <nav className="mr-2 hidden items-center gap-5 text-sm font-medium md:flex">
                {nav.map(([href, l]) => (
                  <a
                    key={href}
                    href={href}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {tr(l)}
                  </a>
                ))}
              </nav>
              <div className="relative">
                <button
                  onClick={() => setLangOpen((v) => !v)}
                  aria-label={tr(T.language)}
                  aria-expanded={langOpen}
                  className="flex h-10 items-center rounded-2xl border border-border bg-card px-3 text-xs font-bold hover:bg-muted"
                >
                  {LANGS.find((l) => l.id === lang)?.short}
                </button>
                {langOpen && (
                  <div className="absolute right-0 top-12 z-50 w-40 overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
                    {LANGS.map((l) => (
                      <button
                        key={l.id}
                        onClick={() => {
                          setLang(l.id);
                          setLangOpen(false);
                        }}
                        className={`flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-sm font-semibold hover:bg-muted ${
                          l.id === lang ? "text-primary" : ""
                        }`}
                      >
                        <span>{l.flag}</span>
                        {l.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <a
                href="#cotizar"
                className="hidden rounded-2xl bg-gradient-warm px-4 py-2.5 sm:inline-flex text-sm font-bold text-rose-foreground shadow-soft"
              >
                {tr(T.navQuote)}
              </a>
            </div>
          </div>
        </header>

        {/* HERO */}
        <section id="inicio" className="border-b border-border/60 bg-muted/40">
          <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-12 lg:grid-cols-[1.1fr_1fr] lg:px-8 lg:py-16">
            <div>
              <span className="mb-4 inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-primary">
                {tr(T.heroKicker)} · {settings.location}
              </span>
              <h1 className="mb-4 text-[2rem] font-black leading-[1.1] tracking-tight [overflow-wrap:anywhere] sm:text-5xl">
                {settings.hero_title}
              </h1>
              <p className="mb-7 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                {settings.hero_subtitle}
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="#cotizar"
                  className="rounded-2xl bg-gradient-warm px-6 py-3 text-sm font-bold text-rose-foreground shadow-soft"
                >
                  {tr(T.ctaQuote)}
                </a>
                <a
                  href="#trabajos"
                  className="rounded-2xl border border-border bg-card px-6 py-3 text-sm font-bold hover:bg-muted"
                >
                  {tr(T.ctaWork)}
                </a>
              </div>
            </div>
            {work.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {work.slice(0, 4).map((p, i) => (
                  <img
                    key={p.id}
                    src={p.img}
                    alt={tr(p.name)}
                    width={400}
                    height={300}
                    className={`aspect-[4/3] w-full rounded-2xl object-cover shadow-soft ${i % 2 ? "translate-y-4" : ""}`}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* SERVICES */}
        <section id="servicios" className="py-14 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 lg:px-8">
            <h2 className="mb-8 text-3xl font-black tracking-tight sm:text-4xl">
              {tr(T.servicesTitle)}
            </h2>
            <div className="grid gap-4 md:grid-cols-3">
              {SERVICES.map((s) => (
                <article
                  key={s.id}
                  className="flex flex-col rounded-3xl border border-border bg-card p-6 shadow-soft"
                >
                  <h3 className="mb-2 text-lg font-black tracking-tight">{tr(s.title)}</h3>
                  <p className="mb-4 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {tr(s.text)}
                  </p>
                  <p className="mb-4 text-xs font-semibold text-foreground/80">{tr(s.examples)}</p>
                  <a
                    href="#cotizar"
                    onClick={() => setForm((f) => ({ ...f, service: s.id }))}
                    className="text-sm font-bold text-primary hover:underline"
                  >
                    {tr(T.ctaQuote)} →
                  </a>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* WORK */}
        <section id="trabajos" className="bg-muted/40 py-14 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 lg:px-8">
            <div className="mb-6 max-w-2xl">
              <h2 className="mb-2 text-3xl font-black tracking-tight sm:text-4xl">
                {tr(T.workTitle)}
              </h2>
              <p className="text-muted-foreground">{tr(T.workText)}</p>
            </div>

            {usedCats.length > 1 && (
              <div className="mb-6 flex flex-wrap gap-2">
                {[{ id: "todos", label: tr(T.all) }, ...usedCats].map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setCat(c.id)}
                    aria-pressed={cat === c.id}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                      cat === c.id
                        ? "bg-foreground text-background"
                        : "border border-border bg-card text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            )}

            {work.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center">
                <p className="mx-auto max-w-lg text-muted-foreground">{tr(T.emptyWork)}</p>
                {isAdmin && (
                  <p className="mt-3 text-xs font-semibold text-primary">{tr(T.emptyWorkAdmin)}</p>
                )}
                <a
                  href="#cotizar"
                  className="mt-6 inline-flex rounded-2xl bg-gradient-warm px-6 py-3 text-sm font-bold text-rose-foreground shadow-soft"
                >
                  {tr(T.ctaQuote)}
                </a>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
                {shown.map((p) => (
                  <article
                    key={p.id}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft sm:rounded-3xl"
                  >
                    <button
                      onClick={() => setDetail(p)}
                      className="relative aspect-[4/3] w-full overflow-hidden bg-muted"
                      aria-label={`${tr(T.details)}: ${tr(p.name)}`}
                    >
                      <img
                        src={p.img}
                        alt={tr(p.name)}
                        width={800}
                        height={600}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      {isAdmin && (
                        <Link
                          to="/admin/products"
                          search={{ edit: p.id }}
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-amber-500 text-xs font-black text-white shadow-sm"
                          aria-label="Edit"
                        >
                          ✎
                        </Link>
                      )}
                    </button>
                    <div className="flex flex-1 flex-col gap-1 p-3 sm:p-5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary sm:text-[11px]">
                        {catLabel(p.cat as string)}
                      </span>
                      <h3 className="line-clamp-2 text-sm font-bold leading-snug sm:text-lg">
                        {tr(p.name)}
                      </h3>
                      <p className="hidden text-xs leading-relaxed text-muted-foreground sm:line-clamp-2">
                        {tr(p.desc)}
                      </p>
                      <div className="mt-auto flex flex-col gap-2 pt-3 sm:flex-row sm:items-center sm:justify-between">
                        {p.price > 0 && (
                          <span className="text-sm text-muted-foreground">
                            {tr(T.from)}{" "}
                            <b className="text-base font-black text-foreground sm:text-lg">
                              {money(p.price)}
                            </b>
                          </span>
                        )}
                        <button
                          onClick={() => quoteFrom(p)}
                          className="rounded-xl bg-primary px-3 py-2 text-xs font-bold text-primary-foreground sm:rounded-2xl"
                        >
                          {tr(T.quoteThis)}
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="como-funciona" className="py-14 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 lg:px-8">
            <h2 className="mb-8 text-3xl font-black tracking-tight sm:text-4xl">
              {tr(T.howTitle)}
            </h2>
            <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((s, i) => (
                <li key={i} className="rounded-3xl border border-border bg-card p-5">
                  <span className="mb-3 grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-sm font-black text-primary">
                    {i + 1}
                  </span>
                  <h3 className="mb-1 font-bold">{tr(s.title)}</h3>
                  <p className="text-sm text-muted-foreground">{tr(s.text)}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* QUOTE FORM */}
        <section id="cotizar" className="scroll-mt-20 bg-muted/40 py-14 sm:py-20">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
            <div>
              <h2 className="mb-3 text-3xl font-black tracking-tight sm:text-4xl">
                {tr(T.quoteTitle)}
              </h2>
              <p className="mb-6 text-muted-foreground">{tr(T.quoteText)}</p>
              <ContactList settings={settings} tr={tr} />
            </div>

            <div className="rounded-3xl border border-border bg-card p-5 shadow-soft sm:p-7">
              {doneCode ? (
                <div className="py-6 text-center" role="status">
                  <h3 className="mb-2 text-2xl font-black">{tr(T.doneTitle)}</h3>
                  <p className="text-muted-foreground">
                    {tr(T.doneText)} <b className="font-mono text-foreground">{doneCode}</b>.
                  </p>
                  <button
                    onClick={() => setDoneCode(null)}
                    className="mt-6 rounded-2xl border border-border px-5 py-2.5 text-sm font-bold hover:bg-muted"
                  >
                    {tr(T.another)}
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void submit();
                  }}
                  className="grid gap-4"
                  noValidate
                >
                  {form.reference && (
                    <div className="flex items-center justify-between gap-3 rounded-2xl bg-primary/10 px-4 py-2.5 text-sm">
                      <span>
                        {tr(T.fRef)}: <b>{form.reference}</b>
                      </span>
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, reference: "" })}
                        aria-label={tr(T.close)}
                        className="font-bold text-muted-foreground"
                      >
                        ×
                      </button>
                    </div>
                  )}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="grid gap-1.5">
                      <span className={label}>{tr(T.fName)}</span>
                      <input
                        id="q-name"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        maxLength={120}
                        autoComplete="name"
                        className={input}
                      />
                    </label>
                    <label className="grid gap-1.5">
                      <span className={label}>{tr(T.fEmail)}</span>
                      <input
                        id="q-email"
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        maxLength={160}
                        autoComplete="email"
                        className={input}
                      />
                    </label>
                  </div>
                  <label className="grid gap-1.5">
                    <span className={label}>{tr(T.fPhone)}</span>
                    <input
                      id="q-phone"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      maxLength={60}
                      className={input}
                    />
                  </label>
                  <fieldset className="grid gap-1.5">
                    <legend className={`${label} mb-1.5`}>{tr(T.fService)}</legend>
                    <div className="flex flex-wrap gap-2">
                      {SERVICE_OPTIONS.map((o) => (
                        <button
                          type="button"
                          key={o.id}
                          onClick={() => setForm({ ...form, service: o.id })}
                          aria-pressed={form.service === o.id}
                          className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                            form.service === o.id
                              ? "bg-foreground text-background"
                              : "border border-border bg-background text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {tr(o.label)}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                  <label className="grid gap-1.5">
                    <span className={label}>{tr(T.fDesc)}</span>
                    <textarea
                      id="q-desc"
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      maxLength={2000}
                      rows={4}
                      placeholder={tr(T.fDescPh)}
                      className={input}
                    />
                  </label>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <label className="grid gap-1.5">
                      <span className={label}>{tr(T.fQty)}</span>
                      <input
                        id="q-qty"
                        type="number"
                        min={1}
                        max={10000}
                        value={form.qty}
                        onChange={(e) => setForm({ ...form, qty: Number(e.target.value) })}
                        className={input}
                      />
                    </label>
                    <label className="grid gap-1.5">
                      <span className={label}>{tr(T.fDate)}</span>
                      <input
                        id="q-date"
                        type="date"
                        min={today}
                        value={form.neededBy}
                        onChange={(e) => setForm({ ...form, neededBy: e.target.value })}
                        className={input}
                      />
                    </label>
                    <label className="grid gap-1.5">
                      <span className={label}>{tr(T.fBudget)}</span>
                      <input
                        id="q-budget"
                        value={form.budget}
                        onChange={(e) => setForm({ ...form, budget: e.target.value })}
                        maxLength={60}
                        placeholder="$"
                        className={input}
                      />
                    </label>
                  </div>
                  <label className="grid gap-1.5">
                    <span className={label}>{tr(T.fFile)}</span>
                    <input
                      id="q-file"
                      type="file"
                      accept=".png,.jpg,.jpeg,.webp,.pdf,.stl,image/png,image/jpeg,image/webp,application/pdf"
                      onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                      className="text-sm file:mr-3 file:rounded-xl file:border-0 file:bg-muted file:px-4 file:py-2 file:text-sm file:font-semibold"
                    />
                    <span className="text-xs text-muted-foreground">{tr(T.fFileHint)}</span>
                  </label>
                  {/* honeypot: hidden from people, bots fill it */}
                  <input
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                    value={form.website}
                    onChange={(e) => setForm({ ...form, website: e.target.value })}
                    className="absolute -left-[9999px] h-0 w-0 opacity-0"
                  />
                  {error && (
                    <p
                      role="alert"
                      className="rounded-2xl bg-rose-500/10 px-4 py-2.5 text-sm font-semibold text-rose-700 dark:text-rose-400"
                    >
                      {error}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={sending}
                    className="rounded-2xl bg-gradient-warm py-3.5 text-sm font-bold text-rose-foreground shadow-soft disabled:opacity-60"
                  >
                    {sending ? tr(T.sending) : tr(T.send)}
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="border-t border-border py-10">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between lg:px-8">
            <div>
              <p className="font-bold text-foreground">{settings.brand_name}</p>
              <p>{tr(T.pickup)}</p>
              <p>{tr(T.prices)}</p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <p>
                © {new Date().getFullYear()} {settings.brand_name}
              </p>
              <Link to="/auth" className="text-xs font-semibold hover:text-foreground">
                {tr(T.admin)}
              </Link>
            </div>
          </div>
        </footer>

        {/* DETAIL MODAL */}
        {detail && (
          <div
            className="fixed inset-0 z-50 grid place-items-center bg-slate-deep/80 p-4 backdrop-blur-md"
            onClick={() => setDetail(null)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label={tr(detail.name)}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-border bg-card p-5 shadow-soft sm:p-6"
            >
              <div className="grid gap-6 sm:grid-cols-2">
                <img
                  src={detail.img}
                  alt={tr(detail.name)}
                  className="aspect-[4/3] w-full rounded-2xl object-cover"
                />
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                    {catLabel(detail.cat as string)}
                  </span>
                  <h3 className="mt-1 text-2xl font-black tracking-tight">{tr(detail.name)}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {tr(detail.desc)}
                  </p>
                  <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    {tr(detail.material) && (
                      <div>
                        <dt className="font-bold uppercase text-muted-foreground">Material</dt>
                        <dd className="font-semibold">{tr(detail.material)}</dd>
                      </div>
                    )}
                    {detail.dimensions && (
                      <div>
                        <dt className="font-bold uppercase text-muted-foreground">Size</dt>
                        <dd className="font-semibold">{detail.dimensions}</dd>
                      </div>
                    )}
                  </dl>
                  <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                    {detail.price > 0 && (
                      <span className="text-muted-foreground">
                        {tr(T.from)}{" "}
                        <b className="text-2xl font-black text-foreground">{money(detail.price)}</b>
                      </span>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setDetail(null)}
                        className="rounded-2xl border border-border px-4 py-2.5 text-sm font-semibold hover:bg-muted"
                      >
                        {tr(T.close)}
                      </button>
                      <button
                        onClick={() => quoteFrom(detail)}
                        className="rounded-2xl bg-gradient-warm px-5 py-2.5 text-sm font-bold text-rose-foreground shadow-soft"
                      >
                        {tr(T.quoteThis)}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function ContactList({ settings, tr }: { settings: Settings; tr: (v: Tri) => string }) {
  const rows: [string, string, string | null][] = [
    [
      tr(T.fEmail),
      settings.contact_email,
      settings.contact_email ? `mailto:${settings.contact_email}` : null,
    ],
    [
      "Tel.",
      settings.contact_phone,
      settings.contact_phone ? `tel:${settings.contact_phone.replace(/[^\d+]/g, "")}` : null,
    ],
    [
      "Instagram",
      settings.instagram_url
        ? settings.instagram_url
            .replace(/^https?:\/\/(www\.)?instagram\.com\//, "@")
            .replace(/\/$/, "")
        : "",
      settings.instagram_url || null,
    ],
    ["Facebook", settings.facebook_url ? "Facebook" : "", settings.facebook_url || null],
    [tr(T.location), settings.location, null],
  ];
  const visible = rows.filter(([, v]) => v);
  if (!visible.length) return null;
  return (
    <dl className="grid gap-3 text-sm">
      {visible.map(([k, v, href]) => (
        <div key={k}>
          <dt className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            {k}
          </dt>
          <dd>
            {href ? (
              <a
                href={href}
                target={href.startsWith("http") ? "_blank" : undefined}
                rel="noopener noreferrer"
                className="font-semibold hover:text-primary"
              >
                {v}
              </a>
            ) : (
              <span className="font-semibold">{v}</span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
