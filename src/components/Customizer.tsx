import { useMemo, useState } from "react";
import { useI18n } from "@/i18n";
import type { Tri } from "@/i18n/lang";
import imgSign from "@/assets/mockup-sign.jpg";
import imgMug from "@/assets/mockup-mug.jpg";
import imgBox from "@/assets/mockup-box.jpg";

/* ── copy ─────────────────────────────────────────────── */
const C = {
  kicker: { en: "Live customizer", fr: "Personnalisation en direct", es: "Personalizador en vivo" },
  title: { en: "Design it, see it, price it", fr: "Concevez, visualisez, chiffrez", es: "Diséñalo, míralo y cotízalo" },
  intro: {
    en: "Every choice updates the mockup and the price in real time. Transparent breakdown, no surprises at checkout.",
    fr: "Chaque choix met à jour la maquette et le prix en temps réel. Détail transparent, aucune surprise au paiement.",
    es: "Cada elección actualiza la maqueta y el precio en tiempo real. Desglose transparente, sin sorpresas al pagar.",
  },
  step: { en: "Step", fr: "Étape", es: "Paso" },
  s1: { en: "Choose your product", fr: "Choisissez le produit", es: "Elige el producto" },
  s2: { en: "Add your text", fr: "Ajoutez votre texte", es: "Añade tu texto" },
  s3: { en: "Typeface", fr: "Police", es: "Tipografía" },
  s4: { en: "Finish", fr: "Fini", es: "Acabado" },
  s5: { en: "Size & quantity", fr: "Format et quantité", es: "Tamaño y cantidad" },
  line1: { en: "Main line", fr: "Ligne principale", es: "Línea principal" },
  line2: { en: "Second line (optional)", fr: "Deuxième ligne (facultatif)", es: "Segunda línea (opcional)" },
  ph1: { en: "Maple & Co.", fr: "Maple & Co.", es: "Maple & Co." },
  ph2: { en: "Est. 2026 · Toronto", fr: "Depuis 2026 · Toronto", es: "Desde 2026 · Toronto" },
  chars: { en: "characters", fr: "caractères", es: "caracteres" },
  preview: { en: "Live mockup", fr: "Maquette en direct", es: "Maqueta en vivo" },
  yourText: { en: "Your text here", fr: "Votre texte ici", es: "Tu texto aquí" },
  qty: { en: "Quantity", fr: "Quantité", es: "Cantidad" },
  breakdown: { en: "Price breakdown", fr: "Détail du prix", es: "Desglose del precio" },
  rowBase: { en: "Base product", fr: "Produit de base", es: "Producto base" },
  rowSize: { en: "Size", fr: "Format", es: "Tamaño" },
  rowText: { en: "Personalization", fr: "Personnalisation", es: "Personalización" },
  rowFinish: { en: "Premium finish", fr: "Fini premium", es: "Acabado premium" },
  rowFont: { en: "Script engraving", fr: "Gravure script", es: "Grabado script" },
  rowUnit: { en: "Price per unit", fr: "Prix unitaire", es: "Precio por unidad" },
  rowDiscount: { en: "Volume discount", fr: "Remise sur quantité", es: "Descuento por volumen" },
  rowTotal: { en: "Total", fr: "Total", es: "Total" },
  free: { en: "Included", fr: "Inclus", es: "Incluido" },
  add: { en: "Add to cart", fr: "Ajouter au panier", es: "Añadir al carrito" },
  reset: { en: "Start over", fr: "Recommencer", es: "Empezar de nuevo" },
  needText: { en: "Type your text to continue", fr: "Écrivez votre texte pour continuer", es: "Escribe tu texto para continuar" },
  proof: {
    en: "Free digital proof before production · Made in Canada · 5–8 business days",
    fr: "Épreuve numérique gratuite avant production · Fabriqué au Canada · 5 à 8 jours ouvrables",
    es: "Prueba digital gratis antes de producir · Hecho en Canadá · 5 a 8 días hábiles",
  },
  tip3: { en: "Save 5% from 3 units", fr: "5 % dès 3 unités", es: "Ahorra 5 % desde 3 unidades" },
  tip6: { en: "Save 10% from 6 units", fr: "10 % dès 6 unités", es: "Ahorra 10 % desde 6 unidades" },
  tip12: { en: "Save 15% from 12 units", fr: "15 % dès 12 unités", es: "Ahorra 15 % desde 12 unidades" },
} satisfies Record<string, Tri>;

type BaseId = "sign" | "mug" | "box";

const BASES: {
  id: BaseId;
  price: number;
  name: Tri;
  material: Tri;
  sizes: { id: string; label: Tri; mult: number }[];
}[] = [
  {
    id: "sign",
    price: 68,
    name: { en: "Laser-cut wood sign", fr: "Enseigne en bois au laser", es: "Letrero en madera a láser" },
    material: { en: "Baltic birch · engraved", fr: "Bouleau baltique · gravé", es: "Abedul báltico · grabado" },
    sizes: [
      { id: "s", label: { en: "30 × 15 cm", fr: "30 × 15 cm", es: "30 × 15 cm" }, mult: 0.85 },
      { id: "m", label: { en: "45 × 22 cm", fr: "45 × 22 cm", es: "45 × 22 cm" }, mult: 1 },
      { id: "l", label: { en: "60 × 30 cm", fr: "60 × 30 cm", es: "60 × 30 cm" }, mult: 1.38 },
    ],
  },
  {
    id: "mug",
    price: 26,
    name: { en: "Ceramic mug", fr: "Tasse en céramique", es: "Pocillo de cerámica" },
    material: { en: "Glazed ceramic · dishwasher safe", fr: "Céramique émaillée · lave-vaisselle", es: "Cerámica esmaltada · apta lavavajillas" },
    sizes: [
      { id: "s", label: { en: "11 oz", fr: "11 oz", es: "11 oz" }, mult: 1 },
      { id: "m", label: { en: "15 oz", fr: "15 oz", es: "15 oz" }, mult: 1.18 },
      { id: "l", label: { en: "Set of 2", fr: "Duo", es: "Set de 2" }, mult: 1.85 },
    ],
  },
  {
    id: "box",
    price: 34,
    name: { en: "Fit dessert box", fr: "Boîte de desserts santé", es: "Caja de postres fit" },
    material: { en: "Protein brownies · no refined sugar", fr: "Brownies protéinés · sans sucre raffiné", es: "Brownies proteicos · sin azúcar refinada" },
    sizes: [
      { id: "s", label: { en: "6 pieces", fr: "6 pièces", es: "6 piezas" }, mult: 0.8 },
      { id: "m", label: { en: "12 pieces", fr: "12 pièces", es: "12 piezas" }, mult: 1 },
      { id: "l", label: { en: "24 pieces", fr: "24 pièces", es: "24 piezas" }, mult: 1.75 },
    ],
  },
];

const FONTS: { id: string; css: string; name: Tri; sample: string; extra: number }[] = [
  { id: "sans", css: "var(--font-sans)", name: { en: "Modern sans", fr: "Sans moderne", es: "Moderna sans" }, sample: "Aa", extra: 0 },
  { id: "serif", css: "var(--font-serif)", name: { en: "Elegant serif", fr: "Serif élégant", es: "Elegante serif" }, sample: "Aa", extra: 5 },
  { id: "mono", css: "var(--font-mono)", name: { en: "Technical mono", fr: "Mono technique", es: "Técnica mono" }, sample: "Aa", extra: 0 },
];

const FINISHES: { id: string; token: string; name: Tri; extra: number }[] = [
  { id: "amber", token: "var(--amber)", name: { en: "Amber wood", fr: "Bois ambré", es: "Ámbar madera" }, extra: 0 },
  { id: "rose", token: "var(--rose)", name: { en: "Party rose", fr: "Rose fête", es: "Rosa fiesta" }, extra: 0 },
  { id: "healthy", token: "var(--healthy)", name: { en: "Healthy green", fr: "Vert santé", es: "Verde healthy" }, extra: 0 },
  { id: "graphite", token: "var(--graphite)", name: { en: "Graphite black", fr: "Noir graphite", es: "Negro grafito" }, extra: 4 },
];

/* real photo of each base product + where the personalization sits on it */
const MOCKUP: Record<BaseId, { photo: string; area: string; maxFs: number; alt: Tri }> = {
  sign: {
    photo: imgSign,
    area: "left-[18%] right-[33%] top-[38%] bottom-[18%]",
    maxFs: 2,
    alt: { en: "Laser-cut wood sign photo", fr: "Photo d'enseigne en bois", es: "Foto de letrero en madera" },
  },
  mug: {
    photo: imgMug,
    area: "left-[24%] right-[40%] top-[35%] bottom-[30%]",
    maxFs: 1.5,
    alt: { en: "Ceramic mug photo", fr: "Photo de tasse en céramique", es: "Foto de pocillo de cerámica" },
  },
  box: {
    photo: imgBox,
    area: "left-[32%] right-[22%] top-[52%] bottom-[20%]",
    maxFs: 1.6,
    alt: { en: "Fit dessert box photo", fr: "Photo de boîte de desserts", es: "Foto de caja de postres fit" },
  },
};

const FREE_CHARS = 14;
const PER_CHAR = 0.65;
const LINE2 = 6;

interface Props {
  onAddToCart: (item: { id: string; name: string; price: number; details: string }) => void;
}

export function Customizer({ onAddToCart }: Props) {
  const { tr, money } = useI18n();

  const [baseId, setBaseId] = useState<BaseId>("sign");
  const [sizeId, setSizeId] = useState("m");
  const [line1, setLine1] = useState("Maple & Co.");
  const [line2, setLine2] = useState("");
  const [fontId, setFontId] = useState("sans");
  const [finishId, setFinishId] = useState("amber");
  const [qty, setQty] = useState(1);

  const base = BASES.find((b) => b.id === baseId)!;
  const size = base.sizes.find((s) => s.id === sizeId) ?? base.sizes[1]!;
  const font = FONTS.find((f) => f.id === fontId)!;
  const finish = FINISHES.find((f) => f.id === finishId)!;

  const price = useMemo(() => {
    const basePrice = base.price;
    const sizeExtra = Math.round((basePrice * size.mult - basePrice) * 100) / 100;
    const chars = (line1.trim() + line2.trim()).length;
    const textExtra = Math.round(Math.max(0, chars - FREE_CHARS) * PER_CHAR * 100) / 100;
    const lineExtra = line2.trim() ? LINE2 : 0;
    const unit = Math.round((basePrice + sizeExtra + textExtra + lineExtra + finish.extra + font.extra) * 100) / 100;
    const rate = qty >= 12 ? 0.15 : qty >= 6 ? 0.1 : qty >= 3 ? 0.05 : 0;
    const gross = unit * qty;
    const discount = Math.round(gross * rate * 100) / 100;
    return { basePrice, sizeExtra, textExtra: textExtra + lineExtra, unit, rate, discount, total: Math.round((gross - discount) * 100) / 100 };
  }, [base, size, line1, line2, finish, font, qty]);

  const hasText = line1.trim().length > 0;
  const mockup = MOCKUP[base.id];

  const reset = () => {
    setBaseId("sign");
    setSizeId("m");
    setLine1("Maple & Co.");
    setLine2("");
    setFontId("sans");
    setFinishId("amber");
    setQty(1);
  };

  const add = () => {
    if (!hasText) return;
    const label = [line1.trim(), line2.trim()].filter(Boolean).join(" / ");
    onAddToCart({
      id: `custom-${base.id}-${Date.now()}`,
      name: `${tr(base.name)} · "${label}"`,
      price: price.total,
      details: `${tr(size.label)} · ${tr(font.name)} · ${tr(finish.name)} · ×${qty}`,
    });
  };

  /* mockup text sizing keeps long names inside the artwork */
  const len = Math.max(line1.trim().length, line2.trim().length, 1);
  const fs = len > 26 ? "0.95rem" : len > 18 ? "1.25rem" : len > 12 ? "1.6rem" : "2rem";

  const stepLabel = (n: number, label: Tri) => (
    <div className="mb-3 flex items-center gap-2">
      <span className="grid h-6 w-6 place-items-center rounded-full bg-primary text-[11px] font-black text-primary-foreground">
        {n}
      </span>
      <span className="text-sm font-bold">{tr(label)}</span>
    </div>
  );

  const chip = (active: boolean) =>
    `rounded-2xl border px-3 py-2.5 text-xs font-bold transition-all ${
      active
        ? "border-transparent bg-primary text-primary-foreground shadow-soft"
        : "border-border bg-card hover:border-primary/40 hover:bg-muted"
    }`;

  return (
    <section id="personalizador" className="py-14 sm:py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="mb-10 max-w-3xl">
          <span className="mb-3 inline-flex rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-primary">
            {tr(C.kicker)}
          </span>
          <h2 className="mb-3 text-3xl font-black tracking-tight sm:text-5xl">{tr(C.title)}</h2>
          <p className="text-muted-foreground sm:text-lg">{tr(C.intro)}</p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.05fr_1fr] lg:gap-10">
          {/* ── controls ─────────────────────────────── */}
          <div className="space-y-7">
            <div>
              {stepLabel(1, C.s1)}
              <div className="grid gap-2 sm:grid-cols-3">
                {BASES.map((b) => {
                  const active = b.id === baseId;
                  return (
                    <button
                      key={b.id}
                      onClick={() => {
                        setBaseId(b.id);
                        setSizeId("m");
                      }}
                      className={`rounded-2xl border p-3 text-left transition-all ${
                        active ? "border-primary bg-primary/5 shadow-soft" : "border-border bg-card hover:bg-muted"
                      }`}
                    >
                      <img
                        src={MOCKUP[b.id].photo}
                        alt={tr(MOCKUP[b.id].alt)}
                        loading="lazy"
                        className="mb-2 h-16 w-full rounded-xl object-cover"
                      />
                      <p className="text-xs font-bold leading-tight">{tr(b.name)}</p>
                      <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{tr(b.material)}</p>
                      <p className="mt-2 text-xs font-black text-primary">{money(b.price)}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              {stepLabel(2, C.s2)}
              <div className="grid gap-2">
                <label className="block">
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {tr(C.line1)}
                  </span>
                  <input
                    value={line1}
                    onChange={(e) => setLine1(e.target.value)}
                    maxLength={32}
                    placeholder={tr(C.ph1)}
                    aria-label={tr(C.line1)}
                    className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-amber"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {tr(C.line2)}
                  </span>
                  <input
                    value={line2}
                    onChange={(e) => setLine2(e.target.value)}
                    maxLength={32}
                    placeholder={tr(C.ph2)}
                    aria-label={tr(C.line2)}
                    className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-amber"
                  />
                </label>
                <p className="text-[11px] text-muted-foreground">
                  {(line1.trim() + line2.trim()).length}/64 {tr(C.chars)} · {FREE_CHARS} {tr(C.free).toLowerCase()}
                </p>
              </div>
            </div>

            <div>
              {stepLabel(3, C.s3)}
              <div className="grid gap-2 sm:grid-cols-3">
                {FONTS.map((f) => (
                  <button key={f.id} onClick={() => setFontId(f.id)} className={chip(f.id === fontId)}>
                    <span className="block text-lg leading-none" style={{ fontFamily: f.css }}>
                      {f.sample}
                    </span>
                    <span className="mt-1 block leading-tight">{tr(f.name)}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              {stepLabel(4, C.s4)}
              <div className="flex flex-wrap gap-2">
                {FINISHES.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFinishId(f.id)}
                    aria-label={tr(f.name)}
                    aria-pressed={f.id === finishId}
                    className={`flex items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-3 text-xs font-bold transition-all ${
                      f.id === finishId ? "border-foreground bg-muted" : "border-border hover:bg-muted"
                    }`}
                  >
                    <span className="h-7 w-7 rounded-full" style={{ backgroundColor: f.token }} />
                    {tr(f.name)}
                    {f.extra > 0 && <span className="text-muted-foreground">+{money(f.extra)}</span>}
                  </button>
                ))}
              </div>
            </div>

            <div>
              {stepLabel(5, C.s5)}
              <div className="grid gap-2 sm:grid-cols-3">
                {base.sizes.map((s) => (
                  <button key={s.id} onClick={() => setSizeId(s.id)} className={chip(s.id === sizeId)}>
                    {tr(s.label)}
                  </button>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex items-center gap-1 rounded-2xl border border-border p-1">
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    aria-label="-"
                    className="grid h-9 w-9 place-items-center rounded-xl text-lg font-black hover:bg-muted"
                  >
                    −
                  </button>
                  <span className="w-10 text-center text-sm font-black">{qty}</span>
                  <button
                    onClick={() => setQty((q) => Math.min(99, q + 1))}
                    aria-label="+"
                    className="grid h-9 w-9 place-items-center rounded-xl text-lg font-black hover:bg-muted"
                  >
                    +
                  </button>
                </div>
                <p className="text-[11px] leading-snug text-muted-foreground">
                  {qty >= 12 ? tr(C.tip12) : qty >= 6 ? tr(C.tip12) : qty >= 3 ? tr(C.tip6) : tr(C.tip3)}
                </p>
              </div>
            </div>
          </div>

          {/* ── live mockup + pricing ────────────────── */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
              <div className="flex items-center justify-between border-b border-border px-5 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                  {tr(C.preview)}
                </p>
                <button onClick={reset} className="text-[11px] font-bold text-primary hover:underline">
                  {tr(C.reset)}
                </button>
              </div>

              {/* real photo of the selected product with the live personalization on top */}
              <div className="relative aspect-[4/3] w-full overflow-hidden">
                <img
                  key={mockup.photo}
                  src={mockup.photo}
                  alt={tr(mockup.alt)}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-opacity duration-300"
                />
                {/* finish tint so the chosen colour reads on the photo */}
                <span
                  aria-hidden
                  className="absolute inset-0 mix-blend-soft-light"
                  style={{ backgroundColor: `color-mix(in oklab, ${finish.token} 45%, transparent)` }}
                />
                <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />

                {/* personalization area, positioned over the product in the photo */}
                <div className={`absolute ${mockup.area} grid place-items-center text-center`}>
                  <div className="px-2">
                    <p
                      className="break-words font-black leading-tight drop-shadow-[0_1px_2px_rgba(255,255,255,0.55)]"
                      style={{
                        fontFamily: font.css,
                        fontSize: `min(${fs}, ${mockup.maxFs}rem)`,
                        color: `color-mix(in oklab, ${finish.token} 72%, black)`,
                      }}
                    >
                      {line1.trim() || tr(C.yourText)}
                    </p>
                    {line2.trim() && (
                      <p
                        className="mt-1 break-words text-[0.65rem] font-semibold uppercase tracking-[0.18em] drop-shadow-[0_1px_2px_rgba(255,255,255,0.5)] sm:text-xs"
                        style={{ fontFamily: font.css, color: `color-mix(in oklab, ${finish.token} 55%, black)` }}
                      >
                        {line2.trim()}
                      </p>
                    )}
                  </div>
                </div>

                <span className="absolute bottom-3 left-3 rounded-full bg-background/85 px-3 py-1 text-[11px] font-bold backdrop-blur-md">
                  {tr(base.name)} · {tr(size.label)}
                </span>
              </div>


              {/* pricing */}
              <div className="border-t border-border p-5">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                  {tr(C.breakdown)}
                </p>
                <dl className="space-y-1.5 text-sm">
                  <Row k={`${tr(C.rowBase)} · ${tr(base.name)}`} v={money(price.basePrice)} />
                  <Row
                    k={`${tr(C.rowSize)} · ${tr(size.label)}`}
                    v={price.sizeExtra === 0 ? tr(C.free) : `${price.sizeExtra > 0 ? "+" : ""}${money(price.sizeExtra)}`}
                  />
                  <Row k={tr(C.rowText)} v={price.textExtra === 0 ? tr(C.free) : `+${money(price.textExtra)}`} />
                  {font.extra > 0 && <Row k={tr(C.rowFont)} v={`+${money(font.extra)}`} />}
                  {finish.extra > 0 && <Row k={tr(C.rowFinish)} v={`+${money(finish.extra)}`} />}
                  <div className="!mt-3 border-t border-dashed border-border pt-2">
                    <Row k={`${tr(C.rowUnit)} × ${qty}`} v={money(price.unit)} />
                    {price.discount > 0 && (
                      <Row
                        k={`${tr(C.rowDiscount)} (${Math.round(price.rate * 100)}%)`}
                        v={`−${money(price.discount)}`}
                        accent
                      />
                    )}
                  </div>
                </dl>
                <div className="mt-3 flex items-baseline justify-between border-t border-border pt-3">
                  <span className="text-sm font-bold">{tr(C.rowTotal)}</span>
                  <span className="text-2xl font-black tracking-tight">{money(price.total)}</span>
                </div>
                <button
                  onClick={add}
                  disabled={!hasText}
                  className="mt-4 w-full rounded-2xl bg-gradient-warm py-4 text-sm font-bold text-rose-foreground shadow-soft transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {hasText ? `${tr(C.add)} — ${money(price.total)}` : tr(C.needText)}
                </button>
                <p className="mt-3 text-center text-[11px] leading-snug text-muted-foreground">{tr(C.proof)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Row({ k, v, accent }: { k: string; v: string; accent?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className={`shrink-0 font-bold ${accent ? "text-healthy" : ""}`}>{v}</dd>
    </div>
  );
}
