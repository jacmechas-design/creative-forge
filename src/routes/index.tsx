import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useRef, useState, useEffect } from "react";
import { Quoter3D } from "@/components/Quoter3D";
import { Customizer } from "@/components/Customizer";
import { useI18n, LANGS } from "@/i18n";
import type { Tri } from "@/i18n/lang";
import { CATS, CAT_LABELS, LEAD_LABELS, type Cat, type Product } from "@/data/products";
import { useCatalog } from "@/hooks/useCatalog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { createOrder } from "@/lib/orders.functions";

import hero from "@/assets/hero-jac.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "JTP — 3D Printing, Party Decor, Laser Wood & Fit Desserts" },
      {
        name: "description",
        content:
          "Canadian digital fabrication studio: 3D printing, laser-cut wood, event styling and healthy desserts. Live customizer, instant 3D quote, prices in CAD.",
      },
      { property: "og:title", content: "JTP — Custom design for your ideas" },
      {
        property: "og:description",
        content:
          "Shop 25 curated best sellers, customize live and get an instant 3D printing quote. Trilingual: EN / FR / ES.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" },
    ],
  }),
  component: JacDesign,
});

/* ── local trilingual copy ─────────────────────────────── */

const EDIT_PRODUCT: Tri = { en: "Edit product", fr: "Modifier le produit", es: "Editar producto" };

const SORTS: { id: "featured" | "price-asc" | "price-desc" | "rating"; label: Tri }[] = [
  { id: "featured", label: { en: "Featured", fr: "En vedette", es: "Destacados" } },
  { id: "price-asc", label: { en: "Price: low to high", fr: "Prix : croissant", es: "Precio: menor a mayor" } },
  { id: "price-desc", label: { en: "Price: high to low", fr: "Prix : décroissant", es: "Precio: mayor a menor" } },
  { id: "rating", label: { en: "Top rated", fr: "Mieux notés", es: "Mejor valorados" } },
];

const SEARCH_PH: Tri = {
  en: "Search by name or material…",
  fr: "Rechercher par nom ou matériau…",
  es: "Buscar por nombre o material…",
};
const ONLY_POPULAR: Tri = { en: "Best sellers only", fr: "Meilleures ventes", es: "Solo más vendidos" };
const SORT_LABEL: Tri = { en: "Sort:", fr: "Trier :", es: "Ordenar:" };
const RESULTS: Tri = { en: "results", fr: "résultats", es: "resultados" };
const NO_RESULTS: Tri = { en: "No products found", fr: "Aucun produit trouvé", es: "No hay productos" };
const NO_RESULTS_HINT: Tri = {
  en: "Try another search term or reset the filters.",
  fr: "Essayez un autre terme ou réinitialisez les filtres.",
  es: "Prueba otro término o restablece los filtros.",
};
const RESET: Tri = { en: "Reset filters", fr: "Réinitialiser", es: "Restablecer filtros" };
const QUOTER_KICKER: Tri = { en: "Real-time 3D studio", fr: "Studio 3D en temps réel", es: "Studio 3D en tiempo real" };
const QUOTER_TITLE: Tri = { en: "Maker Studio · instant 3D quote", fr: "Maker Studio · devis 3D instantané", es: "Maker Studio · cotizador 3D al instante" };
const QUOTER_TEXT: Tri = {
  en: "Preview live 3D geometry, upload your STL for automatic volume analysis, choose engineering materials and infill, and get an exact price in CAD.",
  fr: "Visualisez la géométrie 3D en direct, téléversez votre STL pour l'analyse du volume, choisissez matériaux et remplissage, et obtenez un prix exact en $ CA.",
  es: "Visualiza la geometría 3D en vivo, sube tu STL para el análisis de volumen, elige materiales e infill y obtén el precio exacto en CAD.",
};
const AVAILABILITY: Tri = { en: "Availability", fr: "Disponibilité", es: "Disponibilidad" };
const AVAILABILITY_V: Tri = { en: "Made to order", fr: "Fabriqué sur commande", es: "Hecho por encargo" };
const QUICK_TITLE: Tri = { en: "Product details", fr: "Détails du produit", es: "Detalle del producto" };
const VERIFIED: Tri = { en: "verified reviews", fr: "avis vérifiés", es: "opiniones verificadas" };
const LINKS: Tri = { en: "Quick links", fr: "Liens rapides", es: "Enlaces rápidos" };
const SERVICES: Tri = { en: "Services", fr: "Services", es: "Servicios" };
const WISH_TOAST: Tri = { en: "item(s) in your wishlist", fr: "article(s) dans vos favoris", es: "artículo(s) en favoritos" };

const SERVICE_LIST: Tri[] = [
  { en: "3D printing in PLA, PETG and resin", fr: "Impression 3D en PLA, PETG et résine", es: "Impresión 3D en PLA, PETG y resina" },
  { en: "Laser-cut wood and foam signage", fr: "Enseignes en bois et mousse au laser", es: "Letreros en madera y foam a láser" },
  { en: "Full event styling and balloon decor", fr: "Décor d'événements et ballons", es: "Decoración de eventos y globos" },
  { en: "Healthy, keto and protein pastry", fr: "Pâtisserie santé, keto et protéinée", es: "Repostería saludable, keto y proteica" },
];

const REVIEWS: { name: string; role: Tri; text: Tri }[] = [
  {
    name: "Danielle R.",
    role: { en: "Birthday party · Toronto, ON", fr: "Fête d'anniversaire · Toronto (ON)", es: "Cumpleaños · Toronto, ON" },
    text: {
      en: "The double arch backdrop was identical to the mockup. The team arrived three hours early and set everything up.",
      fr: "La double arche était identique à la maquette. L'équipe est arrivée trois heures d'avance et a tout installé.",
      es: "El backdrop de arcos quedó idéntico al boceto. El equipo llegó tres horas antes y montó todo.",
    },
  },
  {
    name: "Andrew V.",
    role: { en: "Office manager · Mississauga, ON", fr: "Gestionnaire de bureau · Mississauga (ON)", es: "Gerente de oficina · Mississauga, ON" },
    text: {
      en: "Our laser-cut wood wall completely changed the reception area. Flawless finish and packaging.",
      fr: "Notre mur en bois découpé au laser a transformé la réception. Fini et emballage impeccables.",
      es: "Nuestro mural en madera cortada a láser transformó la recepción. Acabado y empaque impecables.",
    },
  },
  {
    name: "Laura M.",
    role: { en: "Fitness coach · Vancouver, BC", fr: "Entraîneuse · Vancouver (C.-B.)", es: "Entrenadora fitness · Vancouver, BC" },
    text: {
      en: "I order the keto brownies weekly for my clients. No added sugar and they taste incredible.",
      fr: "Je commande les brownies keto chaque semaine. Sans sucre ajouté et délicieux.",
      es: "Pido los brownies keto cada semana. Sin azúcar añadida y deliciosos.",
    },
  },
  {
    name: "Charles P.",
    role: { en: "Mechanical engineer · Montréal, QC", fr: "Ingénieur mécanique · Montréal (QC)", es: "Ingeniero mecánico · Montreal, QC" },
    text: {
      en: "I uploaded an STL and had a quote in minutes. The PETG parts passed my load test perfectly.",
      fr: "J'ai téléversé un STL et obtenu un devis en minutes. Les pièces PETG ont réussi mon test de charge.",
      es: "Subí un STL y tuve la cotización en minutos. Las piezas en PETG pasaron la prueba de carga.",
    },
  },
  {
    name: "Sophie C.",
    role: { en: "Wedding planner · Ottawa, ON", fr: "Organisatrice de mariages · Ottawa (ON)", es: "Wedding planner · Ottawa, ON" },
    text: {
      en: "The engraved keepsake boxes were the most talked-about detail of the whole wedding.",
      fr: "Les boîtes souvenirs gravées ont été le détail le plus remarqué du mariage.",
      es: "Las cajas de recuerdo grabadas fueron el detalle más comentado de la boda.",
    },
  },
  {
    name: "Julien O.",
    role: { en: "Hardware startup · Québec, QC", fr: "Startup matérielle · Québec (QC)", es: "Startup de hardware · Quebec, QC" },
    text: {
      en: "Resin prototypes with a level of detail no other local shop matched.",
      fr: "Prototypes en résine d'un niveau de détail inégalé localement.",
      es: "Prototipos en resina con un detalle que ningún otro taller local logró.",
    },
  },
];

/* ── icons ─────────────────────────────────────────────── */

const Icon = {
  cart: (c = "") => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={c}>
      <path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.55L21 8H6" strokeLinecap="round" />
      <circle cx="10" cy="20" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="18" cy="20" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  ),
  heart: (c = "", filled = false) => (
    <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" className={c}>
      <path d="M12 20s-7-4.35-7-9.5A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 7 3.5C19 15.65 12 20 12 20z" />
    </svg>
  ),
  search: (c = "") => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={c}>
      <circle cx="11" cy="11" r="6" />
      <path d="m16 16 4 4" strokeLinecap="round" />
    </svg>
  ),
  close: (c = "") => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className={c}>
      <path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" />
    </svg>
  ),
  star: (c = "") => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={c}>
      <path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9L3.5 9.7l5.9-.8z" />
    </svg>
  ),
  truck: (c = "") => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={c}>
      <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" strokeLinecap="round" />
      <path d="M14 9h4.5a2 2 0 0 1 1.8 1.1l1.6 3.1a2 2 0 0 1 .1.8V17a1 1 0 0 1-1 1h-2" strokeLinecap="round" />
      <circle cx="7.5" cy="18.5" r="2.5" />
      <circle cx="17.5" cy="18.5" r="2.5" />
    </svg>
  ),
  sparkles: (c = "") => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={c}>
      <path
        d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  shield: (c = "") => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={c}>
      <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" strokeLinecap="round" />
      <path d="m9 12 2 2 4-4" strokeLinecap="round" />
    </svg>
  ),
  globe: (c = "") => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={c}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c2.4 2.4 2.4 14.6 0 17M12 3.5c-2.4 2.4-2.4 14.6 0 17" />
    </svg>
  ),
};

const FREE_SHIP_THRESHOLD = 150;

/* ── page ─────────────────────────────────────────────── */

function JacDesign() {
  const { t, tr, money, lang, setLang } = useI18n();
  const { products } = useCatalog();
  const { isAdmin } = useAuth();

  const [cat, setCat] = useState<"todos" | Cat>("todos");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"featured" | "price-asc" | "price-desc" | "rating">("featured");
  const [onlyPopular, setOnlyPopular] = useState(false);
  const [wish, setWish] = useState<string[]>([]);
  const [cart, setCart] = useState<{ id: string; name: string; price: number }[]>([]);
  const [quick, setQuick] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [toasts, setToasts] = useState<{ id: number; text: string }[]>([]);
  const [contact, setContact] = useState({ name: "", email: "", phone: "", message: "" });
  const [buyer, setBuyer] = useState({ name: "", email: "", phone: "" });
  const [sending, setSending] = useState(false);
  const toastId = useRef(0);
  const [uiSettings, setUiSettings] = useState({
    show_hero: true,
    show_quoter: true,
    show_catalog: true,
    show_reviews: true,
    show_services: true
  });

  useEffect(() => {
    supabase.from("ui_settings").select("*").eq("id", "default").single().then(({ data }) => {
      if (data) setUiSettings(data as any);
    });
  }, []);


  const toast = (msg: string) => {
    const id = ++toastId.current;
    setToasts((x) => [...x, { id, text: msg }]);
    setTimeout(() => setToasts((x) => x.filter((y) => y.id !== id)), 2600);
  };

  const categoryTabs = useMemo(
    () =>
      CATS.map((c) => ({
        id: c.id,
        label: tr(CAT_LABELS[c.id]),
        count: c.id === "todos" ? products.length : products.filter((p) => p.cat === c.id).length,
      })),
    [tr, products]
  );

  const filtered = useMemo(() => {
    let list = products;
    if (cat !== "todos") list = list.filter((p) => p.cat === cat);
    if (onlyPopular) list = list.filter((p) => p.popular);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) =>
        [p.name[lang], p.desc[lang], p.tag[lang], p.material[lang]]
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }
    if (sort === "price-asc") return [...list].sort((a, b) => a.price - b.price);
    if (sort === "price-desc") return [...list].sort((a, b) => b.price - a.price);
    if (sort === "rating")
      return [...list].sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);
    return list;
  }, [products, cat, onlyPopular, search, sort, lang]);

  const total = cart.reduce((s, i) => s + i.price, 0);
  const missingForFree = Math.max(0, FREE_SHIP_THRESHOLD - total);

  const addToCart = (p: { id: string; name: string; price: number }) => {
    setCart((c) => [...c, { id: p.id, name: p.name, price: p.price }]);
    toast(`${p.name} — ${t("addedToCart")}`);
  };

  const toggleWish = (p: Product) => {
    const saved = wish.includes(p.id);
    setWish((w) => (saved ? w.filter((x) => x !== p.id) : [...w, p.id]));
    toast(`${tr(p.name)} — ${saved ? t("removedFromWishlist") : t("addedToWishlist")}`);
  };

  /* ── orders are stored in the business panel ─────────── */
  const placeOrder = async () => {
    if (!buyer.name.trim() || !buyer.email.trim()) {
      toast(t("contactIncomplete"));
      return;
    }
    setSending(true);
    try {
      const res = await createOrder({
        data: {
          name: buyer.name.trim(),
          email: buyer.email.trim(),
          phone: buyer.phone.trim() || null,
          lang,
          items: cart.map((i) => ({ slug: i.id, name: i.name, price: i.price, qty: 1 })),
        },
      });
      setCart([]);
      setCartOpen(false);
      setBuyer({ name: "", email: "", phone: "" });
      toast(`${t("checkoutDone")} — ${res.code}`);
    } catch {
      toast(t("saveError"));
    } finally {
      setSending(false);
    }
  };

  const sendMessage = async () => {
    if (!contact.name.trim() || !contact.email.trim() || !contact.message.trim()) {
      toast(t("contactIncomplete"));
      return;
    }
    setSending(true);
    try {
      const { error } = await supabase.from("messages").insert({
        name: contact.name.trim(),
        email: contact.email.trim(),
        phone: contact.phone.trim() || null,
        body: contact.message.trim(),
        lang,
      });
      if (error) throw error;
      setContact({ name: "", email: "", phone: "", message: "" });
      toast(t("contactSent"));
    } catch {
      toast(t("saveError"));
    } finally {
      setSending(false);
    }
  };

  const navLinks: [string, string][] = [
    ["#inicio", t("navHome")],
    ["#colecciones", t("navCatalog")],
    ["#personalizador", t("navCustomizer")],
    ["#cotizador", t("navQuoter")],
    ["#galeria", t("navReviews")],
    ["#contacto", t("navContact")],
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* NAV */}
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md">
        <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 lg:px-8">
          <a href="#inicio" className="flex min-w-0 items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-warm text-base font-black tracking-tight text-rose-foreground shadow-soft">
              JD
            </span>
            <span className="min-w-0">
              <span className="block truncate text-lg font-extrabold tracking-tight">JTP</span>
              <span className="block truncate text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                {t("tagline")}
              </span>
            </span>
          </a>

          <div className="flex items-center gap-2">
            <nav className="mr-2 hidden items-center gap-5 text-sm font-medium xl:flex">
              {navLinks.map(([href, label]) => (
                <a key={href} href={href} className="text-muted-foreground transition-colors hover:text-foreground">
                  {label}
                </a>
              ))}
            </nav>

            {/* language switcher */}
            <div className="relative">
              <button
                onClick={() => setLangOpen((v) => !v)}
                aria-label={t("language")}
                aria-expanded={langOpen}
                className="flex h-11 items-center gap-1.5 rounded-2xl border border-border bg-card px-2.5 text-xs font-bold transition-colors hover:bg-muted"
              >
                {Icon.globe("h-4 w-4")}
                {LANGS.find((l) => l.id === lang)?.short}
              </button>
              {langOpen && (
                <div className="absolute right-0 top-12 z-50 w-44 overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
                  {LANGS.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => {
                        setLang(l.id);
                        setLangOpen(false);
                      }}
                      className={`flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-sm font-semibold transition-colors hover:bg-muted ${
                        l.id === lang ? "text-primary" : "text-foreground"
                      }`}
                    >
                      <span>{l.flag}</span>
                      {l.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => toast(`${wish.length} ${tr(WISH_TOAST)}`)}
              className="relative grid h-11 w-11 place-items-center rounded-2xl border border-border bg-card transition-colors hover:bg-muted"
              aria-label={t("wishlist")}
            >
              {Icon.heart("h-5 w-5 text-rose", wish.length > 0)}
              <Badge n={wish.length} />
            </button>
            <button
              onClick={() => setCartOpen(true)}
              className="relative grid h-11 w-11 place-items-center rounded-2xl border border-border bg-card transition-colors hover:bg-muted"
              aria-label={t("cart")}
            >
              {Icon.cart("h-5 w-5")}
              <Badge n={cart.length} />
            </button>
          </div>
        </div>
      </header>

      {/* HERO */}
      {uiSettings.show_hero && (
      <section
        id="inicio"
        className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-white to-amber-50 dark:from-dark dark:via-dark dark:to-secondary"
      >
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-amber-100 blur-3xl dark:bg-amber-900/20" />
        <div className="absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-rose-100 blur-3xl dark:bg-rose-900/20" />
        <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8 lg:py-20">
          <div className="grid items-center gap-8 lg:grid-cols-[1fr_1.1fr]">
            <div>
              <span className="mb-5 inline-flex items-center gap-2 rounded-full bg-gradient-warm px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-rose-foreground shadow-soft">
                {t("heroBadge")}
              </span>
              <h1 className="mb-5 text-[1.9rem] font-black leading-[1.1] tracking-tight [overflow-wrap:anywhere] sm:text-5xl lg:text-6xl">
                {t("heroTitle1")}{" "}
                <span className="bg-gradient-warm bg-clip-text text-transparent">{t("heroTitle2")}</span>
              </h1>
              <p className="mb-7 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                {t("heroText")}
              </p>
              <div className="mb-8 flex flex-wrap gap-3">
                <a
                  href="#colecciones"
                  className="rounded-2xl bg-gradient-warm px-6 py-3 text-sm font-bold text-rose-foreground shadow-soft transition-transform hover:scale-[1.04]"
                >
                  {t("ctaShop")}
                </a>
                <a
                  href="#personalizador"
                  className="rounded-2xl border border-border bg-card px-6 py-3 text-sm font-bold transition-colors hover:bg-muted"
                >
                  {t("ctaCustomize")}
                </a>
              </div>
              <dl className="grid grid-cols-3 gap-2 text-center text-xs sm:text-sm">
                <div className="rounded-2xl border border-border bg-card p-3">
                  <dt className="text-lg font-black text-amber-600">{products.length}</dt>
                  <dd className="text-muted-foreground">{t("statProducts")}</dd>
                </div>
                <div className="rounded-2xl border border-border bg-card p-3">
                  <dt className="text-lg font-black text-amber-600">4.9★</dt>
                  <dd className="text-muted-foreground">{t("statRating")}</dd>
                </div>
                <div className="rounded-2xl border border-border bg-card p-3">
                  <dt className="text-lg font-black text-amber-600">24 h</dt>
                  <dd className="text-muted-foreground">{t("statShip")}</dd>
                </div>
              </dl>
            </div>
            <div className="relative">
              <img
                src={hero}
                width={1200}
                height={900}
                alt="Custom balloon arch and engraved wood signage styled by Jac Design"
                className="w-full rounded-3xl shadow-2xl"
              />
            </div>
          </div>
        </div>

        {/* trust bar */}
        <div className="border-t border-border/70 bg-card/70 backdrop-blur-md">
          <ul className="mx-auto grid max-w-7xl grid-cols-2 gap-y-2 px-4 py-4 text-[11px] font-semibold text-muted-foreground sm:text-xs lg:grid-cols-4 lg:px-8">
            {[t("trustShipping"), t("trustSecure"), t("trustGuarantee"), t("trustLocal")].map((x) => (
              <li key={x} className="flex items-center gap-2">
                <span className="text-emerald-600">{Icon.shield("h-4 w-4")}</span>
                {x}
              </li>
            ))}
          </ul>
        </div>
      </section>
      )}

      {/* CATALOG */}
      {uiSettings.show_catalog && (
      <section id="colecciones" className="bg-muted/60 py-14 sm:py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mx-auto mb-10 max-w-3xl text-center">
            <span className="mb-3 inline-flex rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-primary">
              {t("catalogKicker")}
            </span>
            <h2 className="mb-3 text-3xl font-black tracking-tight sm:text-5xl">{t("catalogTitle")}</h2>
            <p className="mx-auto max-w-2xl text-muted-foreground sm:text-lg">{t("catalogText")}</p>
          </div>

          <div className="mb-6 flex flex-wrap justify-center gap-2">
            {categoryTabs.map((c) => (
              <button
                key={c.id}
                onClick={() => setCat(c.id)}
                className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-semibold transition-all sm:text-sm ${
                  cat === c.id
                    ? "scale-105 bg-gradient-warm text-rose-foreground shadow-soft"
                    : "border border-border bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>{c.label}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                    cat === c.id ? "bg-black/20 text-white" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {c.count}
                </span>
              </button>
            ))}
          </div>

          {/* toolbar */}
          <div className="mb-8 flex flex-col items-center justify-between gap-3 rounded-3xl border border-border bg-card p-3 shadow-soft sm:p-4 md:flex-row">
            <div className="relative w-full md:w-80">
              <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
                {Icon.search("h-4 w-4")}
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={tr(SEARCH_PH)}
                aria-label={tr(SEARCH_PH)}
                className="w-full rounded-2xl border border-input bg-background py-2.5 pl-10 pr-10 text-sm outline-none focus:ring-2 focus:ring-amber"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  aria-label={t("close")}
                  className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground"
                >
                  {Icon.close("h-4 w-4")}
                </button>
              )}
            </div>

            <div className="flex w-full flex-wrap items-center justify-between gap-2 md:w-auto md:justify-end md:gap-3">
              <button
                onClick={() => setOnlyPopular(!onlyPopular)}
                className={`inline-flex items-center gap-1.5 rounded-2xl px-3 py-2.5 text-[11px] font-bold transition-colors sm:text-xs ${
                  onlyPopular
                    ? "bg-amber-500 text-white shadow-soft"
                    : "border border-border bg-muted/40 text-muted-foreground hover:text-foreground"
                }`}
              >
                {Icon.sparkles("h-3.5 w-3.5")}
                <span>{tr(ONLY_POPULAR)}</span>
              </button>

              <div className="flex items-center gap-2">
                <span className="hidden text-xs font-semibold text-muted-foreground sm:inline">{tr(SORT_LABEL)}</span>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as typeof sort)}
                  aria-label={tr(SORT_LABEL)}
                  className="rounded-2xl border border-input bg-background px-3 py-2 text-xs font-semibold outline-none focus:ring-2 focus:ring-amber"
                >
                  {SORTS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {tr(s.label)}
                    </option>
                  ))}
                </select>
              </div>

              <span className="px-1 text-xs font-bold text-muted-foreground">
                {filtered.length} {tr(RESULTS)}
              </span>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center">
              <h3 className="text-xl font-bold">{tr(NO_RESULTS)}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{tr(NO_RESULTS_HINT)}</p>
              <button
                onClick={() => {
                  setCat("todos");
                  setSearch("");
                  setOnlyPopular(false);
                  setSort("featured");
                }}
                className="mt-6 rounded-2xl bg-gradient-warm px-6 py-2.5 text-sm font-bold text-rose-foreground shadow-soft"
              >
                {tr(RESET)}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3">
              {filtered.map((p) => (
                <article
                  key={p.id}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-amber hover:shadow-xl sm:rounded-3xl"
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                    <img
                      src={p.img}
                      width={800}
                      height={600}
                      loading="lazy"
                      alt={tr(p.name)}
                      className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                    <div className="absolute left-1.5 top-1.5 flex flex-col items-start gap-1 sm:left-3 sm:top-3">
                      <span className="max-w-[9rem] truncate rounded-full bg-card/90 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider shadow-sm backdrop-blur-md sm:px-3 sm:py-1 sm:text-[10px]">
                        {tr(p.tag)}
                      </span>
                      {p.popular && (
                        <span className="flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white shadow-sm">
                          {Icon.sparkles("h-2.5 w-2.5")} {t("popular")}
                        </span>
                      )}
                    </div>

                    <div className="absolute right-1.5 top-1.5 z-10 flex flex-col gap-1.5 sm:right-3 sm:top-3 sm:gap-2">
                      <button
                        onClick={() => toggleWish(p)}
                        aria-label={t("wishlist")}
                        className="grid h-8 w-8 place-items-center rounded-full bg-card/90 text-rose shadow-sm backdrop-blur-md transition-transform hover:scale-110 sm:h-9 sm:w-9"
                      >
                        {Icon.heart("h-4 w-4", wish.includes(p.id))}
                      </button>
                      <button
                        onClick={() => setQuick(p)}
                        aria-label={t("quickView")}
                        className="grid h-8 w-8 place-items-center rounded-full bg-card/90 shadow-sm backdrop-blur-md transition-transform hover:scale-110 hover:text-primary sm:h-9 sm:w-9"
                      >
                        {Icon.search("h-4 w-4")}
                      </button>
                      {isAdmin && (
                        <Link
                          to="/admin/products"
                          search={{ edit: p.id }}
                          aria-label={tr(EDIT_PRODUCT)}
                          title={tr(EDIT_PRODUCT)}
                          className="grid h-8 w-8 place-items-center rounded-full bg-amber-500 text-[11px] font-black text-white shadow-sm transition-transform hover:scale-110 sm:h-9 sm:w-9"
                        >
                          ✎
                        </Link>
                      )}
                    </div>

                    <div className="absolute bottom-1.5 right-1.5 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-md sm:bottom-3 sm:right-3 sm:px-2.5 sm:py-1 sm:text-[11px]">
                      <span className="text-amber-400">{Icon.star("h-3 w-3")}</span>
                      <span>{p.rating.toFixed(1)}</span>
                      <span className="hidden text-[10px] text-white/70 sm:inline">({p.reviewCount})</span>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-3 sm:p-5">
                    <div className="mb-1 flex min-w-0 flex-wrap items-center gap-x-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:mb-1.5 sm:text-[11px]">
                      <span className="truncate font-bold text-primary">{tr(CAT_LABELS[p.cat])}</span>
                      <span className="hidden sm:inline">•</span>
                      <span className="hidden items-center gap-1 sm:flex">
                        {Icon.truck("h-3 w-3")} {tr(LEAD_LABELS[p.lead])}
                      </span>
                    </div>

                    <h3 className="line-clamp-2 text-sm font-bold leading-snug tracking-tight transition-colors group-hover:text-amber-600 sm:text-lg">
                      {tr(p.name)}
                    </h3>

                    <p className="mt-1.5 hidden flex-1 text-xs leading-relaxed text-muted-foreground sm:line-clamp-2 sm:mt-2">
                      {tr(p.desc)}
                    </p>

                    <div className="mt-2 flex flex-col gap-2 border-t border-border/60 pt-2 sm:mt-3 sm:flex-row sm:items-center sm:justify-between sm:pt-3">
                      <span className="text-base font-black tracking-tight sm:text-xl">{money(p.price)}</span>
                      <div className="grid grid-cols-2 gap-1.5 sm:flex sm:items-center sm:gap-2">
                        <button
                          onClick={() => addToCart({ id: p.id, name: tr(p.name), price: p.price })}
                          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-2 py-2 text-[11px] font-bold text-primary-foreground shadow-sm transition-transform hover:scale-[1.04] sm:rounded-2xl sm:text-xs"
                        >
                          {Icon.cart("h-3.5 w-3.5")} {t("addToCart")}
                        </button>
                        <button
                          onClick={() => setQuick(p)}
                          className="inline-flex items-center justify-center gap-1 rounded-xl bg-muted px-2 py-2 text-[11px] font-bold transition-colors hover:bg-muted/80 sm:rounded-2xl sm:text-xs"
                        >
                          {Icon.search("h-3.5 w-3.5")} {t("quickView")}
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CUSTOMIZER */}
      <Customizer
        onAddToCart={(item) => {
          addToCart(item);
          setCartOpen(true);
        }}
      />


      {/* 3D QUOTER */}
      {uiSettings.show_quoter && (
      <section id="cotizador" className="bg-muted/40 py-14 sm:py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mb-10 max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-600">
              {tr(QUOTER_KICKER)}
            </div>
            <h2 className="mb-3 text-3xl font-black tracking-tight sm:text-5xl">{tr(QUOTER_TITLE)}</h2>
            <p className="text-muted-foreground sm:text-lg">{tr(QUOTER_TEXT)}</p>
          </div>

          <Quoter3D
            onAddToCart={(item) => {
              addToCart(item);
              setCartOpen(true);
              void supabase.from("quotes").insert({
                file_name: item.name,
                estimate_cad: item.price,
                notes: item.details ?? null,
              });
            }}
          />
        </div>
      </section>
      )}

      {/* REVIEWS */}
      {uiSettings.show_reviews && (
      <section id="galeria" className="py-14 sm:py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <span className="mb-3 inline-flex rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-primary">
              {t("reviewsKicker")}
            </span>
            <h2 className="text-3xl font-black tracking-tight sm:text-5xl">{t("reviewsTitle")}</h2>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {REVIEWS.map((r) => (
              <article
                key={r.name}
                className="rounded-3xl border border-border bg-card p-6 shadow-soft transition-all hover:border-amber hover:shadow-lg"
              >
                <div className="mb-4 flex items-start gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-warm">
                    <span className="text-sm font-bold text-rose-foreground">{r.name.charAt(0)}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-lg font-bold">{r.name}</p>
                    <p className="text-sm text-muted-foreground">{tr(r.role)}</p>
                  </div>
                </div>
                <blockquote className="mb-4 leading-relaxed text-muted-foreground">“{tr(r.text)}”</blockquote>
                <div className="flex gap-1 text-amber-500">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <span key={i}>{Icon.star("h-3.5 w-3.5")}</span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* FOOTER + CONTACT */}
      <footer className="border-t border-border bg-muted/50 py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          {/* CONTACT */}
          <div
            id="contacto"
            className="mb-12 grid gap-6 rounded-3xl border border-border bg-card p-5 shadow-soft sm:p-8 lg:grid-cols-[1fr_1.2fr]"
          >
            <div>
              <span className="mb-2 inline-flex rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-primary">
                {t("contactKicker")}
              </span>
              <h2 className="text-xl font-black tracking-tight sm:text-3xl">{t("contactTitle")}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{t("contactText")}</p>
              <dl className="mt-5 space-y-3 text-sm">
                <div>
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    {t("phoneLabel")}
                  </dt>
                  <dd>
                    <a href="tel:+16475550142" className="font-semibold hover:text-amber-600">
                      +1 (647) 555-0142
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    {t("emailLabel")}
                  </dt>
                  <dd>
                    <a href="mailto:hello@jac-design.ca" className="font-semibold hover:text-amber-600">
                      hello@jac-design.ca
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    {t("hoursLabel")}
                  </dt>
                  <dd className="font-semibold">{t("hoursValue")}</dd>
                </div>
              </dl>
              <p className="mt-4 text-[11px] italic text-muted-foreground">{t("placeholderNote")}</p>
              <Link
                to="/auth"
                className="mt-4 inline-flex rounded-2xl border border-border px-4 py-2.5 text-xs font-bold hover:bg-muted"
              >
                {t("adminAccess")}
              </Link>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                void sendMessage();
              }}
              className="grid gap-3"
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  value={contact.name}
                  onChange={(e) => setContact({ ...contact, name: e.target.value })}
                  maxLength={100}
                  placeholder={t("fieldName")}
                  aria-label={t("fieldName")}
                  className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-amber"
                />
                <input
                  value={contact.phone}
                  onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                  maxLength={30}
                  type="tel"
                  placeholder={t("fieldPhone")}
                  aria-label={t("fieldPhone")}
                  className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-amber"
                />
              </div>
              <input
                value={contact.email}
                onChange={(e) => setContact({ ...contact, email: e.target.value })}
                maxLength={255}
                type="email"
                placeholder={t("fieldEmail")}
                aria-label={t("fieldEmail")}
                className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-amber"
              />
              <textarea
                value={contact.message}
                onChange={(e) => setContact({ ...contact, message: e.target.value })}
                maxLength={1000}
                rows={4}
                placeholder={t("fieldMessage")}
                aria-label={t("fieldMessage")}
                className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-amber"
              />
              <button
                type="submit"
                className="w-full rounded-2xl bg-gradient-warm py-3.5 text-sm font-bold text-rose-foreground shadow-soft transition-transform hover:scale-[1.02]"
              >
                {t("send")}
              </button>
            </form>
          </div>

          <div className="mb-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <span className="mb-3 block text-2xl font-black tracking-tight">Jac Design</span>
              <p className="text-sm text-muted-foreground">{t("footerText")}</p>
            </div>
            <div>
              <h3 className="mb-4 font-bold">{tr(LINKS)}</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                {navLinks.slice(0, 5).map(([href, label]) => (
                  <li key={href}>
                    <a href={href} className="transition-colors hover:text-foreground">
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="mb-4 font-bold">{tr(SERVICES)}</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                {SERVICE_LIST.map((s) => (
                  <li key={s.en}>{tr(s)}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex flex-col items-center justify-between gap-2 border-t border-border pt-8 text-xs text-muted-foreground lg:flex-row">
            <p>© 2026 Jac Design. {t("rights")}</p>
            <p>{t("pricesCad")}</p>
          </div>
        </div>
      </footer>

      {/* mobile sticky cart bar */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 p-3 backdrop-blur-md sm:hidden">
          <button
            onClick={() => setCartOpen(true)}
            className="flex w-full items-center justify-between rounded-2xl bg-gradient-warm px-4 py-3 text-sm font-bold text-rose-foreground shadow-soft"
          >
            <span className="flex items-center gap-2">
              {Icon.cart("h-4 w-4")} {cart.length} · {t("cart")}
            </span>
            <span>{money(total)}</span>
          </button>
        </div>
      )}

      {/* QUICK VIEW MODAL */}
      {quick && (
        <Modal onClose={() => setQuick(null)} title={tr(QUICK_TITLE)} closeLabel={t("close")}>
          <div className="grid items-start gap-6 sm:grid-cols-2">
            <div className="relative overflow-hidden rounded-2xl bg-muted">
              <img
                src={quick.img}
                width={900}
                height={700}
                loading="lazy"
                alt={tr(quick.name)}
                className="aspect-[4/3] w-full rounded-2xl object-cover shadow-sm"
              />
              <span className="absolute left-3 top-3 rounded-full bg-card/90 px-3 py-1 text-[10px] font-bold uppercase tracking-wider shadow-sm backdrop-blur-md">
                {tr(quick.tag)}
              </span>
            </div>

            <div className="flex flex-col">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-primary">
                  {tr(CAT_LABELS[quick.cat])}
                </span>
                <div className="flex items-center gap-1 text-xs font-bold text-amber-500">
                  {Icon.star("h-3.5 w-3.5")}
                  <span>{quick.rating.toFixed(1)}</span>
                  <span className="text-[11px] font-normal text-muted-foreground">
                    ({quick.reviewCount} {tr(VERIFIED)})
                  </span>
                </div>
              </div>

              <h3 className="text-2xl font-black tracking-tight">{tr(quick.name)}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{tr(quick.desc)}</p>

              <div className="mt-4 grid grid-cols-2 gap-2.5 rounded-2xl border border-border/70 bg-muted/50 p-3.5 text-xs">
                <div>
                  <span className="block text-[10px] font-bold uppercase text-muted-foreground">{t("material")}</span>
                  <span className="font-semibold">{tr(quick.material)}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold uppercase text-muted-foreground">{t("size")}</span>
                  <span className="font-semibold">{quick.dimensions}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold uppercase text-muted-foreground">{t("delivery")}</span>
                  <span className="font-semibold">{tr(LEAD_LABELS[quick.lead])}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold uppercase text-muted-foreground">{tr(AVAILABILITY)}</span>
                  <span className="font-semibold text-emerald-600">{tr(AVAILABILITY_V)}</span>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
                <div>
                  <span className="block text-[10px] font-bold uppercase text-muted-foreground">{t("totalPrice")}</span>
                  <p className="text-3xl font-black tracking-tight">{money(quick.price)}</p>
                </div>
                <button
                  onClick={() => {
                    addToCart({ id: quick.id, name: tr(quick.name), price: quick.price });
                    setQuick(null);
                  }}
                  className="rounded-2xl bg-gradient-warm px-6 py-3.5 text-sm font-bold text-rose-foreground shadow-soft transition-transform hover:scale-[1.03]"
                >
                  {Icon.cart("mr-2 inline h-4 w-4")} {t("buyNow")}
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* CART MODAL */}
      {cartOpen && (
        <Modal onClose={() => setCartOpen(false)} title={t("cartTitle")} closeLabel={t("close")}>
          {cart.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">{t("cartEmpty")}</p>
          ) : (
            <>
              <ul className="divide-y divide-border">
                {cart.map((item, i) => (
                  <li key={`${item.id}-${i}`} className="flex items-center gap-3 py-3">
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold">{item.name}</span>
                    <span className="text-sm font-bold">{money(item.price)}</span>
                    <button
                      onClick={() => setCart((c) => c.filter((_, idx) => idx !== i))}
                      aria-label={t("remove")}
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-muted"
                    >
                      {Icon.close("h-4 w-4")}
                    </button>
                  </li>
                ))}
              </ul>
              <p className="mt-4 rounded-2xl bg-emerald-500/10 px-4 py-2.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                {missingForFree === 0 ? t("free") : `${money(missingForFree)} ${t("awayFromFree")}`}
              </p>
              <div className="mt-3 flex items-center justify-between rounded-2xl bg-muted p-4">
                <span className="text-sm font-semibold text-muted-foreground">{t("total")}</span>
                <span className="text-xl font-black">{money(total)}</span>
              </div>
              <div className="mt-4 grid gap-2">
                <input
                  value={buyer.name}
                  onChange={(e) => setBuyer({ ...buyer, name: e.target.value })}
                  placeholder={t("fieldName")}
                  aria-label={t("fieldName")}
                  maxLength={100}
                  className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-amber"
                />
                <div className="grid gap-2 sm:grid-cols-2">
                  <input
                    type="email"
                    value={buyer.email}
                    onChange={(e) => setBuyer({ ...buyer, email: e.target.value })}
                    placeholder={t("fieldEmail")}
                    aria-label={t("fieldEmail")}
                    className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-amber"
                  />
                  <input
                    type="tel"
                    value={buyer.phone}
                    onChange={(e) => setBuyer({ ...buyer, phone: e.target.value })}
                    placeholder={t("fieldPhone")}
                    aria-label={t("fieldPhone")}
                    maxLength={30}
                    className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-amber"
                  />
                </div>
              </div>
              <button
                onClick={() => void placeOrder()}
                disabled={sending}
                className="mt-3 w-full rounded-2xl bg-gradient-warm py-4 text-sm font-bold text-rose-foreground shadow-soft transition-transform hover:scale-[1.02] disabled:opacity-60"
              >
                {sending ? "…" : t("checkout")}
              </button>
            </>
          )}
        </Modal>
      )}

      {/* TOASTS */}
      <div className="pointer-events-none fixed bottom-20 right-4 z-[60] flex flex-col gap-2 sm:bottom-5">
        {toasts.map((x) => (
          <div
            key={x.id}
            className="max-w-[80vw] truncate rounded-2xl bg-slate-deep px-5 py-3 text-sm font-semibold text-primary-foreground shadow-soft"
          >
            {x.text}
          </div>
        ))}
      </div>
    </div>
  );
}

function Badge({ n }: { n: number }) {
  if (n === 0) return null;
  return (
    <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-gradient-warm px-1 text-[10px] font-black text-rose-foreground">
      {n}
    </span>
  );
}


function Modal({
  title,
  onClose,
  closeLabel,
  children,
}: {
  title: string;
  onClose: () => void;
  closeLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-deep/80 p-4 backdrop-blur-md">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-border bg-card p-5 shadow-soft sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-lg font-black tracking-tight">{title}</h2>
          <button
            onClick={onClose}
            aria-label={closeLabel}
            className="grid h-9 w-9 place-items-center rounded-full border border-border transition-colors hover:bg-muted"
          >
            {Icon.close("h-4 w-4")}
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
