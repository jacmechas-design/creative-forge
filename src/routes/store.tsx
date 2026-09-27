import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { 
  ShoppingBag, 
  Sparkles, 
  Box, 
  ScanLine, 
  Crosshair, 
  Shirt, 
  Trophy, 
  Layers3, 
  ExternalLink,
  MessageCircle,
  ShieldCheck,
  Zap
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  price: number;
  old_price?: number;
  category: string;
  badge: string;
  features: string[];
}

export const Route = createFileRoute("/store")({
  component: Store,
});

const defaultStoreProducts: Product[] = [
  {
    id: "JTP-LAMP-01",
    name: "Lámpara LED Acrílica Grabada Night Light",
    price: 24.50,
    old_price: 32.00,
    category: "Corte & Grabado Láser",
    badge: "★ #1 Más Vendido",
    features: [
      "Acrílico óptico Cast 4mm + Base madera Haya",
      "Iluminación LED RGB 16 colores táctil y remoto",
      "Tolerancia milimétrica ±0.05 mm corte pulido",
      "Despacho inmediato o personalizado en 24h"
    ],
  },
  {
    id: "JTP-3D-ORG02",
    name: "Organizador Modular de Escritorio 3D Pro",
    price: 28.00,
    old_price: 35.00,
    category: "Impresión 3D Volumétrica",
    badge: "★ JTP Choice",
    features: [
      "PLA Pro Matte biodegradable reforzado",
      "Capa ultra fina de 0.16 mm con infill giroide",
      "Ensamble magnético con imanes de neodimio",
      "6 compartimentos modulares configurables"
    ],
  },
  {
    id: "JTP-LSR-TRM03",
    name: "Termo Térmico 304 Grabado Láser Personalizado",
    price: 22.00,
    old_price: 29.00,
    category: "Grabado Láser de Fibra",
    badge: "★ Prime Despacho",
    features: [
      "Acero inoxidable 304 grado alimenticio (750 ml)",
      "Aislamiento al vacío: 24h frío / 12h caliente",
      "Grabado láser de fibra inalterable permanente",
      "Pintura powder coating mate antideslizante"
    ],
  },
  {
    id: "JTP-ART-GEO04",
    name: "Cuadro Geométrico Multicapa 3D Arte Pared",
    price: 65.00,
    old_price: 85.00,
    category: "Corte Láser & Arte Multicapa",
    badge: "★ Edición Limitada",
    features: [
      "7 capas de madera Abedul Báltico 3mm seleccionada",
      "Corte láser de precisión micrométrica sin astillas",
      "Medidas 45 x 30 x 2.8 cm con barniz protector UV",
      "Ensamblado y acabado manual artesanal"
    ],
  },
  {
    id: "JTP-3D-LIT05",
    name: "Litofanía 3D Luminosa con Marco LED",
    price: 34.00,
    old_price: 42.00,
    category: "Modelado 3D Óptico",
    badge: "★ Top Regalo",
    features: [
      "Polímero blanco translúcido HD con relieve óptico",
      "Revela tu fotografía en alta definición con la luz",
      "Incluye marco de madera y alimentación USB",
      "Fabricación personalizada a partir de tu foto"
    ],
  },
  {
    id: "JTP-DTF-TSH06",
    name: "Camiseta Streetwear Oversize DTF",
    price: 25.00,
    old_price: 32.00,
    category: "Estampado Textil DTF",
    badge: "★ Moda Textil",
    features: [
      "100% Algodón Peinado Heavyweight 240 GSM",
      "Estampado textil DTF digital elástico HD",
      "Resistencia certificada de +60 lavados",
      "Corte moderno regular/oversize disponible"
    ],
  },
  {
    id: "JTP-CORP-TRF07",
    name: "Trofeo Híbrido Cristal Acrílico & Nogal",
    price: 42.00,
    old_price: 55.00,
    category: "Corte Láser & Madera",
    badge: "★ Corporativo",
    features: [
      "Acrílico cristal Cast 10mm + Base nogal macizo",
      "Grabado láser invertido con pulido por flama",
      "Medidas: 22 x 12 x 5 cm para premios y galas",
      "Personalización con logotipo vectorial y nombres"
    ],
  },
  {
    id: "JTP-LSR-BOX08",
    name: "Caja Secreta de Madera con Ensamble Japonés",
    price: 29.00,
    old_price: 38.00,
    category: "Corte Láser & Mecánica",
    badge: "★ Artesanía Digital",
    features: [
      "Madera contrachapada de abedul báltico 3mm",
      "Ensamble de dientes de fricción sin clavos",
      "Grabado fractal con patrón geométrico",
      "Medidas: 16 x 10 x 8 cm de apertura mecánica"
    ],
  },
];

function Store() {
  const [products, setProducts] = useState<Product[]>(defaultStoreProducts);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  useEffect(() => {
    supabase
      .from("products")
      .select("id, name, price, features")
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          const mapped: Product[] = data.map((item, idx) => ({
            id: item.id,
            name: item.name,
            price: Number(item.price),
            category: "Catálogo",
            badge: "★ Disponible",
            features: Array.isArray(item.features) ? item.features : ["Pieza de fabricación digital"],
          }));
          setProducts(mapped);
        }
      });
  }, []);

  const filteredProducts = activeCategory === "all" 
    ? products 
    : products.filter(p => p.category.toLowerCase().includes(activeCategory.toLowerCase()));

  const handleWhatsAppOrder = (product: Product) => {
    const text = `Hola JTP! Me interesa comprar o personalizar el siguiente producto de la tienda:\n\n- *${product.name}* (Ref: ${product.id})\n- *Precio:* $${product.price.toFixed(2)} USD\n- *Detalles:* ${product.features.slice(0, 2).join(", ")}`;
    const url = `https://wa.me/15550192834?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  return (
    <main className="min-h-screen bg-[#080c14] text-gray-100 py-12 px-4 lg:px-8 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="mx-auto max-w-7xl relative z-10 space-y-12">
        {/* Header */}
        <header className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-xs font-semibold text-blue-400 uppercase tracking-widest">
            <ShoppingBag className="w-3.5 h-3.5 text-blue-400" />
            <span>Tienda Virtual JTP • Tonos Azules</span>
          </div>
          <h1 className="font-heading text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
            Catálogo de Piezas & <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-cyan-300 bg-clip-text text-transparent">Miscelánea</span>
          </h1>
          <p className="text-base sm:text-lg text-gray-400 leading-relaxed">
            Productos que ya hemos fabricado con corte láser, impresión 3D volumétrica y tecnología textil. Precios claros, fichas de características técnicas y pedidos inmediatos.
          </p>

          <div className="pt-2 flex flex-wrap justify-center gap-3">
            <a
              href="/jtp.html#catalogo"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white font-bold text-xs shadow-lg shadow-blue-500/25 transition-all"
            >
              <span>Ver Landing Completa JTP (Simulador + Carrito)</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </header>

        {/* Categories Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {[
            { id: "all", label: "Todos los Productos" },
            { id: "láser", label: "⚡ Corte & Grabado Láser" },
            { id: "3d", label: "🧊 Impresión 3D" },
            { id: "dtf", label: "👕 Moda DTF Textil" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeCategory === cat.id
                  ? "bg-gradient-to-r from-blue-600 to-sky-600 text-white shadow-md shadow-blue-600/30"
                  : "bg-slate-900/80 border border-slate-800 text-gray-400 hover:text-white hover:border-blue-500/40"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {filteredProducts.map((p) => (
            <Card key={p.id} className="flex flex-col justify-between overflow-hidden bg-slate-900/70 border-slate-800 hover:border-blue-500/50 transition-all duration-300 group shadow-xl">
              <div>
                <CardHeader className="p-5 pb-3 space-y-2 border-b border-slate-800/80 bg-gradient-to-b from-blue-950/20 to-transparent">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      {p.badge}
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">{p.category}</span>
                  </div>
                  <CardTitle className="font-heading text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                    {p.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  {/* Price */}
                  <div className="flex items-baseline gap-2">
                    <span className="font-heading text-2xl font-extrabold text-white">
                      ${p.price.toFixed(2)}
                    </span>
                    {p.old_price && (
                      <span className="text-xs text-gray-500 line-through">
                        ${p.old_price.toFixed(2)}
                      </span>
                    )}
                    <span className="text-[10px] text-emerald-400 font-bold ml-auto bg-emerald-500/10 px-2 py-0.5 rounded">
                      En Stock
                    </span>
                  </div>

                  {/* Technical Bullet Features */}
                  <div className="space-y-1.5 text-xs text-gray-300 border-t border-slate-800/80 pt-3">
                    {p.features.map((f, i) => (
                      <div key={i} className="flex items-start gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                        <span className="text-[11px] leading-relaxed text-gray-300">{f}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </div>

              {/* Action Buttons */}
              <div className="p-5 pt-0 space-y-2">
                <Button 
                  onClick={() => handleWhatsAppOrder(p)}
                  className="w-full bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white font-bold text-xs shadow-md shadow-blue-600/25 flex items-center justify-center gap-1.5"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Pedir / Cotizar WhatsApp</span>
                </Button>
                <a
                  href="/jtp.html#catalogo"
                  className="block text-center text-[11px] text-gray-400 hover:text-blue-300 transition-colors py-1"
                >
                  Ver Ficha Interactiva en Landing &rarr;
                </a>
              </div>
            </Card>
          ))}
        </section>

        {/* Bottom Trust Banner */}
        <section className="p-8 rounded-3xl bg-gradient-to-r from-blue-950/40 via-slate-900/60 to-blue-950/40 border border-blue-500/20 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-400 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-heading text-lg font-bold text-white">Fabricación Digital de Precisión JTP</h3>
              <p className="text-xs text-gray-400">¿Necesitas una pieza con dimensiones, materiales o logos personalizados? Usa nuestro cotizador.</p>
            </div>
          </div>
          <a
            href="/jtp.html#cotizador"
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all shrink-0"
          >
            Cotizador Express en Línea
          </a>
        </section>
      </div>
    </main>
  );
}
