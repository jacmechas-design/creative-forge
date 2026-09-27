import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

// Define product type – adjust fields to match your Supabase table if you have one
interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string;
  features: string[];
}

export const Route = createFileRoute("/store")({
  component: Store,
});

function Store() {
  const [products, setProducts] = useState<Product[]>([]);

  // Load products – if you have a "products" table in Supabase, this will pull real data.
  // Otherwise, we fall back to static mock data.
  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase.from("products").select("id, name, price, image_url, features");
      if (!error && data && data.length) {
        setProducts(data as Product[]);
      } else {
        // Static fallback – you can replace this with real data later.
        setProducts([
          {
            id: "1",
            name: "Laser‑cut Acrylic Badge",
            price: 12.5,
            image_url: "/images/sample1.jpg",
            features: ["1 mm acrylic", "Precision laser cut", "Custom engraving"],
          },
          {
            id: "2",
            name: "PLA 3D‑Printed Miniature",
            price: 19.99,
            image_url: "/images/sample2.jpg",
            features: ["0.12 mm layer height", "Full‑color PLA", "Ready for painting"],
          },
          {
            id: "3",
            name: "DTF Printed T‑Shirt",
            price: 24.0,
            image_url: "/images/sample3.jpg",
            features: ["100 % cotton", "Vibrant colors", "Wash‑proof up to 50 cycles"],
          },
        ]);
      }
    };
    fetchProducts();
  }, []);

  return (
    <main className="min-h-screen bg-background text-foreground py-12">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <header className="mb-12 text-center">
          <h1 className="font-heading text-4xl font-bold text-primary">
            Tienda JTP – Productos disponibles
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Explora los objetos que ya hemos fabricado. Cada pieza incluye precio y características técnicas.
          </p>
        </header>
        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <Card key={p.id} className="flex flex-col overflow-hidden glass-card">
              <CardHeader className="p-4">
                <CardTitle className="font-heading text-xl text-primary">{p.name}</CardTitle>
                <CardDescription className="text-sm text-muted-foreground">${p.price.toFixed(2)}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 p-4">
                {p.image_url && (
                  <img src={p.image_url} alt={p.name} className="mb-4 w-full rounded" />
                )}
                <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {p.features.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </CardContent>
              <div className="p-4 text-center">
                <Button asChild variant="forge">
                  <Link to="/store/$productId" params={{ productId: p.id }}>
                    Ver detalle
                  </Link>
                </Button>
              </div>
            </Card>
          ))}
        </section>
      </div>
    </main>
  );
}
