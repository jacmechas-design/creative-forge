import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useI18n } from "@/i18n";
import type { Tri } from "@/i18n/lang";
import { PortfolioGallery } from "@/components/PortfolioGallery";
import { usePortfolio } from "@/lib/portfolio";
import { loadContent, DEFAULT_SITE_SETTINGS, type SiteSettings } from "@/lib/content";

export const Route = createFileRoute("/portfolio")({
  head: () => ({
    meta: [
      { title: "Portfolio — JTP custom UV printing, laser & 3D printing in Edmonton" },
      {
        name: "description",
        content:
          "Photos and videos of custom tumblers, coasters, signs, keychains and 3D prints made by JTP in Edmonton, Alberta.",
      },
      { property: "og:title", content: "JTP portfolio — custom pieces made in Edmonton" },
      {
        property: "og:description",
        content: "See our latest UV printing, laser and 3D printing projects.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PortfolioPage,
});

const T = {
  title: { en: "Our work", fr: "Nos réalisations", es: "Nuestros trabajos" },
  text: {
    en: "Real projects made in our Edmonton workshop. Like something? We can make one for you, personalized.",
    fr: "De vrais projets faits dans notre atelier d'Edmonton. Une idée vous plaît ? Nous la personnalisons pour vous.",
    es: "Proyectos reales hechos en nuestro taller de Edmonton. ¿Te gusta algo? Te hacemos uno personalizado.",
  },
  back: { en: "Home", fr: "Accueil", es: "Inicio" },
  quote: { en: "Get a quote", fr: "Devis", es: "Cotizar" },
  loading: { en: "Loading projects…", fr: "Chargement…", es: "Cargando trabajos…" },
  empty: {
    en: "We're adding photos of our latest projects. Check back soon, or tell us your idea.",
    fr: "Nous ajoutons des photos de nos derniers projets. Revenez bientôt ou décrivez-nous votre idée.",
    es: "Estamos subiendo fotos de nuestros últimos proyectos. Vuelve pronto o cuéntanos tu idea.",
  },
  ctaTitle: {
    en: "Want something like this?",
    fr: "Vous voulez quelque chose de semblable ?",
    es: "¿Quieres algo así?",
  },
  ctaText: {
    en: "Tell us your idea and we'll send you a price and a digital proof.",
    fr: "Décrivez votre idée et nous vous enverrons un prix et une épreuve numérique.",
    es: "Cuéntanos tu idea y te enviamos el precio y una prueba digital.",
  },
  ctaBtn: {
    en: "Request a free quote",
    fr: "Demander un devis gratuit",
    es: "Pide tu cotización gratis",
  },
  follow: {
    en: "Follow us on Instagram",
    fr: "Suivez-nous sur Instagram",
    es: "Síguenos en Instagram",
  },
} satisfies Record<string, Tri>;

function PortfolioPage() {
  const { tr } = useI18n();
  const { data: items = [], isLoading } = usePortfolio();
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);

  useEffect(() => {
    void loadContent<Partial<SiteSettings>>("global_settings").then(
      (d) => d && setSettings((s) => ({ ...s, ...d })),
    );
  }, []);

  // "Quote one like this" carries the project title to the form on the home page.
  const goQuote = (title?: string) => {
    window.location.assign(title ? `/?ref=${encodeURIComponent(title)}#cotizar` : "/#cotizar");
  };

  return (
    <>
      <style>{`
        :root, .dark { --primary: ${settings.primary_color}; --ring: ${settings.primary_color}; }
        .bg-gradient-warm { background: linear-gradient(135deg, ${settings.primary_color}, #3b82f6); }
      `}</style>
      <div className="min-h-screen bg-background text-foreground">
        <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 lg:px-8">
            <Link to="/" className="flex min-w-0 items-center gap-3">
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
            </Link>
            <div className="flex items-center gap-2">
              <Link
                to="/"
                className="hidden rounded-2xl px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground sm:inline"
              >
                {tr(T.back)}
              </Link>
              <button
                onClick={() => goQuote()}
                className="rounded-2xl bg-gradient-warm px-4 py-2.5 text-sm font-bold text-rose-foreground shadow-soft"
              >
                {tr(T.quote)}
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-10 sm:py-14 lg:px-8">
          <div className="mb-8 max-w-2xl">
            <h1 className="mb-3 text-3xl font-black tracking-tight sm:text-5xl">{tr(T.title)}</h1>
            <p className="text-muted-foreground sm:text-lg">{tr(T.text)}</p>
          </div>

          {isLoading ? (
            <p className="py-16 text-center text-muted-foreground">{tr(T.loading)}</p>
          ) : items.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center">
              <p className="mx-auto max-w-lg text-muted-foreground">{tr(T.empty)}</p>
            </div>
          ) : (
            <PortfolioGallery items={items} onQuote={(i) => goQuote(i.title)} />
          )}

          <section className="mt-14 flex flex-col items-start justify-between gap-4 rounded-3xl bg-muted/60 p-6 sm:flex-row sm:items-center sm:p-8">
            <div>
              <h2 className="text-xl font-black tracking-tight sm:text-2xl">{tr(T.ctaTitle)}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{tr(T.ctaText)}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => goQuote()}
                className="rounded-2xl bg-gradient-warm px-5 py-3 text-sm font-bold text-rose-foreground shadow-soft"
              >
                {tr(T.ctaBtn)}
              </button>
              {settings.instagram_url && (
                <a
                  href={settings.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-2xl border border-border bg-card px-5 py-3 text-sm font-bold hover:bg-muted"
                >
                  {tr(T.follow)}
                </a>
              )}
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
