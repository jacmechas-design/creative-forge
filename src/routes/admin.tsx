import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowDown,
  ArrowUp,
  Boxes,
  Check,
  GalleryHorizontal,
  ImagePlus,
  LayoutDashboard,
  LogOut,
  Package,
  PackagePlus,
  Pencil,
  Save,
  Search,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import workshopImage from "@/assets/forgelab-workshop.jpg";
import partsImage from "@/assets/forgelab-parts.jpg";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin tienda virtual | JTP" },
      { name: "description", content: "Sistema de administracion para catalogo, galeria e inventario de la tienda virtual JTP." },
    ],
  }),
  component: AdminPage,
});

type ProductStatus = "Publicado" | "Borrador" | "Pausado";
type StockStatus = "En stock" | "Bajo stock" | "Agotado";

type Product = {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  status: ProductStatus;
  featured: boolean;
  description: string;
  images: string[];
};

const ADMIN_EMAIL = "admin@jtp.test";
const ADMIN_PASSWORD = "Admin123!";
const SESSION_KEY = "jtp-admin-confirmed";

const starterProducts: Product[] = [
  {
    id: "PRD-1001",
    name: "Pieza tecnica impresa 3D",
    sku: "JTP-3D-001",
    category: "3D Printing",
    price: 32,
    stock: 18,
    status: "Publicado",
    featured: true,
    description: "Componente funcional fabricado en PLA Pro o PETG para prototipos y repuestos.",
    images: [partsImage, workshopImage],
  },
  {
    id: "PRD-1002",
    name: "Grabado laser personalizado",
    sku: "JTP-LZ-014",
    category: "Laser Engraving",
    price: 24,
    stock: 7,
    status: "Publicado",
    featured: true,
    description: "Servicio de grabado permanente sobre madera, acrilico, aluminio anodizado o cuero.",
    images: [workshopImage, partsImage],
  },
  {
    id: "PRD-1003",
    name: "Corte laser en acrilico",
    sku: "JTP-CUT-022",
    category: "Laser Cutting",
    price: 45,
    stock: 0,
    status: "Pausado",
    featured: false,
    description: "Cortes limpios para letreros, plantillas, displays y piezas de ensamble.",
    images: [partsImage],
  },
];

const emptyProduct: Product = {
  id: "",
  name: "",
  sku: "",
  category: "3D Printing",
  price: 0,
  stock: 0,
  status: "Borrador",
  featured: false,
  description: "",
  images: [],
};

function getStockStatus(stock: number): StockStatus {
  if (stock <= 0) return "Agotado";
  if (stock <= 8) return "Bajo stock";
  return "En stock";
}

function AdminPage() {
  const [signedIn, setSignedIn] = useState(false);
  const [email, setEmail] = useState(ADMIN_EMAIL);
  const [password, setPassword] = useState(ADMIN_PASSWORD);
  const [products, setProducts] = useState<Product[]>(starterProducts);
  const [selectedId, setSelectedId] = useState(starterProducts[0].id);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todas");
  const [draft, setDraft] = useState<Product>(starterProducts[0]);
  const [newImage, setNewImage] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setSignedIn(localStorage.getItem(SESSION_KEY) === "true");
    const saved = localStorage.getItem("jtp-products");
    if (saved) {
      const parsed = JSON.parse(saved) as Product[];
      setProducts(parsed);
      setSelectedId(parsed[0]?.id ?? "");
      setDraft(parsed[0] ?? emptyProduct);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("jtp-products", JSON.stringify(products));
  }, [products]);

  const categories = useMemo(() => ["Todas", ...Array.from(new Set(products.map((product) => product.category)))], [products]);
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesQuery = [product.name, product.sku, product.category].join(" ").toLowerCase().includes(query.toLowerCase());
      const matchesCategory = category === "Todas" || product.category === category;
      return matchesQuery && matchesCategory;
    });
  }, [category, products, query]);
  const selectedProduct = products.find((product) => product.id === selectedId) ?? products[0] ?? emptyProduct;
  const revenue = products.reduce((sum, product) => sum + product.price * product.stock, 0);
  const lowStockCount = products.filter((product) => product.stock <= 8).length;

  const signIn = (event: React.FormEvent) => {
    event.preventDefault();
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      localStorage.setItem(SESSION_KEY, "true");
      setSignedIn(true);
      toast.success("Administrador de pruebas confirmado.");
      return;
    }
    toast.error("Credenciales de prueba no coinciden.");
  };

  const openProduct = (product: Product, edit = false) => {
    setSelectedId(product.id);
    setDraft(product);
    setIsEditing(edit);
    setNewImage("");
  };

  const saveDraft = () => {
    const normalized = { ...draft, id: draft.id || `PRD-${Date.now().toString().slice(-5)}` };
    setProducts((current) => {
      const exists = current.some((product) => product.id === normalized.id);
      return exists ? current.map((product) => (product.id === normalized.id ? normalized : product)) : [normalized, ...current];
    });
    setSelectedId(normalized.id);
    setIsEditing(false);
    toast.success("Producto guardado.");
  };

  const addProduct = () => {
    const next = { ...emptyProduct, id: `PRD-${Date.now().toString().slice(-5)}`, name: "Nuevo producto", sku: "JTP-NEW", images: [partsImage] };
    setProducts((current) => [next, ...current]);
    openProduct(next, true);
    toast.success("Nuevo producto creado. Ya puedes editarlo.");
  };

  const updateBulkStatus = (status: ProductStatus) => {
    setProducts((current) => current.map((product) => (selectedRows.includes(product.id) ? { ...product, status } : product)));
    toast.success(`${selectedRows.length} productos actualizados.`);
  };

  const removeProduct = (id: string) => {
    const next = products.filter((product) => product.id !== id);
    setProducts(next);
    setSelectedRows((current) => current.filter((rowId) => rowId !== id));
    openProduct(next[0] ?? emptyProduct, false);
  };

  const addImage = () => {
    if (!newImage.trim()) return;
    setDraft((current) => ({ ...current, images: [...current.images, newImage.trim()] }));
    setNewImage("");
  };

  if (!signedIn) {
    return (
      <main className="grid-surface flex min-h-screen items-center justify-center bg-background px-5 py-12 text-foreground">
        <section className="w-full max-w-lg border border-border bg-background">
          <div className="border-b border-border p-7">
            <Link to="/" className="font-display text-2xl font-black tracking-widest text-primary">JTP</Link>
            <Badge className="mt-6 rounded-none border-primary/40 bg-primary/10 text-primary" variant="outline">
              <ShieldCheck className="mr-1 size-3" /> Usuario administrador de pruebas confirmado
            </Badge>
            <h1 className="mt-5 text-3xl font-semibold">Panel de gestion de tienda virtual.</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Accede con el usuario creado para pruebas y administra productos, inventario y galeria.</p>
          </div>
          <form onSubmit={signIn} className="space-y-5 p-7">
            <Label className="block">Email<Input className="mt-2 h-12 rounded-none" type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></Label>
            <Label className="block">Password<Input className="mt-2 h-12 rounded-none" type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></Label>
            <div className="border border-border bg-secondary p-4 font-mono text-xs text-muted-foreground">
              admin: {ADMIN_EMAIL}<br />password: {ADMIN_PASSWORD}<br />estado: confirmado
            </div>
            <Button className="w-full" size="xl" variant="forge" type="submit"><ShieldCheck /> Entrar como administrador</Button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
          <div className="flex items-center gap-3"><LayoutDashboard className="size-5 text-primary" /><span className="font-display text-xl font-semibold">JTP Admin</span></div>
          <div className="flex items-center gap-2">
            <Badge className="hidden rounded-none bg-success/15 text-success sm:inline-flex" variant="outline"><Check className="mr-1 size-3" /> admin confirmado</Badge>
            <Button variant="industrial" size="sm" onClick={() => { localStorage.removeItem(SESSION_KEY); setSignedIn(false); }}><LogOut /> Salir</Button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-8">
        <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <p className="font-mono text-xs uppercase text-primary">Sistema completo / catalogo, galeria, inventario</p>
            <h1 className="mt-2 text-4xl font-semibold">Gestion de tienda virtual</h1>
          </div>
          <Button variant="forge" onClick={addProduct}><PackagePlus /> Nuevo producto</Button>
        </div>

        <div className="grid gap-px border border-border bg-border md:grid-cols-4">
          {[
            [Package, "Productos", products.length],
            [Boxes, "Inventario", products.reduce((sum, product) => sum + product.stock, 0)],
            [GalleryHorizontal, "Imagenes", products.reduce((sum, product) => sum + product.images.length, 0)],
            [ShieldCheck, "Valor stock", `$${revenue.toLocaleString()}`],
          ].map(([Icon, label, value]) => {
            const StatIcon = Icon as typeof Package;
            return <div key={label as string} className="bg-background p-5"><StatIcon className="size-5 text-primary" /><p className="mt-5 text-3xl font-semibold">{value as string}</p><p className="mt-1 text-xs uppercase text-muted-foreground">{label as string}</p></div>;
          })}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_.65fr]">
          <section className="border border-border bg-background">
            <div className="flex flex-col gap-3 border-b border-border p-4 md:flex-row">
              <div className="relative flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="h-11 rounded-none pl-10" placeholder="Buscar por nombre, SKU o categoria" value={query} onChange={(event) => setQuery(event.target.value)} /></div>
              <select className="h-11 border border-input bg-secondary px-3 text-sm" value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select>
              <Button variant="industrial" disabled={!selectedRows.length} onClick={() => updateBulkStatus("Publicado")}>Publicar</Button>
              <Button variant="industrial" disabled={!selectedRows.length} onClick={() => updateBulkStatus("Pausado")}>Pausar</Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead><TableHead>Producto</TableHead><TableHead>Precio</TableHead><TableHead>Stock</TableHead><TableHead>Estado</TableHead><TableHead className="text-right">Accion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => {
                  const stockStatus = getStockStatus(product.stock);
                  return (
                    <TableRow key={product.id} className={selectedId === product.id ? "bg-accent/40" : ""}>
                      <TableCell><Checkbox checked={selectedRows.includes(product.id)} onCheckedChange={(checked) => setSelectedRows((current) => checked ? [...current, product.id] : current.filter((id) => id !== product.id))} /></TableCell>
                      <TableCell>
                        <button className="flex items-center gap-3 text-left" onClick={() => openProduct(product)}>
                          <img src={product.images[0] || partsImage} alt="" className="size-12 border border-border object-cover" />
                          <span><span className="block font-semibold">{product.name}</span><span className="font-mono text-xs text-muted-foreground">{product.sku} · {product.category}</span></span>
                        </button>
                      </TableCell>
                      <TableCell className="font-mono">${product.price}</TableCell>
                      <TableCell><Badge className="rounded-none" variant={stockStatus === "Agotado" ? "destructive" : "outline"}>{product.stock} · {stockStatus}</Badge></TableCell>
                      <TableCell><Badge className="rounded-none bg-secondary" variant="outline">{product.status}</Badge></TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" onClick={() => openProduct(product, true)} aria-label="Editar producto"><Pencil /></Button>
                          <Button size="icon" variant="ghost" onClick={() => removeProduct(product.id)} aria-label="Eliminar producto"><Trash2 /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </section>

          <aside className="border border-border bg-background">
            <div className="border-b border-border p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-xs uppercase text-primary">{isEditing ? "Editando producto" : "Vista de producto"}</p>
                  <h2 className="mt-2 text-2xl font-semibold">{selectedProduct.name || "Nuevo producto"}</h2>
                </div>
                {!isEditing && selectedProduct.id && (
                  <Button variant="industrial" size="sm" onClick={() => setIsEditing(true)}>
                    <Pencil /> Editar
                  </Button>
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{lowStockCount} productos requieren revision de stock.</p>
            </div>
            <div className="space-y-4 p-5">
              <Label className="block">Nombre<Input className="mt-2 rounded-none" value={draft.name} disabled={!isEditing} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></Label>
              <div className="grid grid-cols-2 gap-3">
                <Label className="block">SKU<Input className="mt-2 rounded-none" value={draft.sku} disabled={!isEditing} onChange={(event) => setDraft({ ...draft, sku: event.target.value })} /></Label>
                <Label className="block">Categoria<Input className="mt-2 rounded-none" value={draft.category} disabled={!isEditing} onChange={(event) => setDraft({ ...draft, category: event.target.value })} /></Label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Label className="block">Precio<Input className="mt-2 rounded-none" type="number" value={draft.price} disabled={!isEditing} onChange={(event) => setDraft({ ...draft, price: Number(event.target.value) })} /></Label>
                <Label className="block">Stock<Input className="mt-2 rounded-none" type="number" value={draft.stock} disabled={!isEditing} onChange={(event) => setDraft({ ...draft, stock: Number(event.target.value) })} /></Label>
              </div>
              <Label className="block">Estado<select className="mt-2 h-10 w-full border border-input bg-secondary px-3 text-sm disabled:opacity-50" value={draft.status} disabled={!isEditing} onChange={(event) => setDraft({ ...draft, status: event.target.value as ProductStatus })}><option>Publicado</option><option>Borrador</option><option>Pausado</option></select></Label>
              <Label className="block">Descripcion<Textarea className="mt-2 rounded-none" value={draft.description} disabled={!isEditing} onChange={(event) => setDraft({ ...draft, description: event.target.value })} /></Label>

              <div className="border border-border p-3">
                <div className="mb-3 flex items-center justify-between"><span className="text-sm font-semibold">Galeria</span><Badge className="rounded-none" variant="outline">{draft.images.length} imagenes</Badge></div>
                <div className="grid grid-cols-3 gap-2">
                  {draft.images.map((image, index) => (
                    <div key={`${image}-${index}`} className="group relative aspect-square border border-border">
                      <img src={image} alt="" className="size-full object-cover" />
                      <div className="absolute inset-x-1 bottom-1 flex justify-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <Button size="icon" variant="industrial" disabled={!isEditing} onClick={() => setDraft((current) => ({ ...current, images: current.images.map((item, itemIndex) => itemIndex === 0 ? image : itemIndex === index ? current.images[0] : item) }))} aria-label="Hacer principal"><Pencil /></Button>
                        <Button size="icon" variant="industrial" disabled={!isEditing} onClick={() => setDraft((current) => ({ ...current, images: current.images.filter((_, itemIndex) => itemIndex !== index) }))} aria-label="Quitar imagen"><Trash2 /></Button>
                      </div>
                      {index === 0 && <span className="absolute left-1 top-1 bg-primary px-1.5 py-0.5 font-mono text-[9px] uppercase text-primary-foreground">Principal</span>}
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex gap-2"><Input className="rounded-none" placeholder="Pegar URL de imagen" value={newImage} disabled={!isEditing} onChange={(event) => setNewImage(event.target.value)} /><Button variant="industrial" disabled={!isEditing} onClick={addImage}><ImagePlus /></Button></div>
                <div className="mt-3 flex gap-2"><Button variant="industrial" size="sm" disabled={!isEditing} onClick={() => setDraft((current) => ({ ...current, images: [...current.images.slice(1), current.images[0]].filter(Boolean) }))}><ArrowDown /> Rotar</Button><Button variant="industrial" size="sm" disabled={!isEditing} onClick={() => setDraft((current) => ({ ...current, images: [current.images.at(-1)!, ...current.images.slice(0, -1)].filter(Boolean) }))}><ArrowUp /> Subir ultima</Button></div>
              </div>
              {isEditing ? <Button className="w-full" size="xl" variant="forge" onClick={saveDraft}><Save /> Guardar producto</Button> : <Button className="w-full" size="xl" variant="industrial" onClick={() => setIsEditing(true)}><Pencil /> Editar producto</Button>}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
