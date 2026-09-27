import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { Archive, ArrowLeft, ArrowRight, Copy, LogOut, Package, Pencil, Plus, RefreshCw, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ProductEditor } from '@/components/product-editor';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { catalogError, imageUrl, listProducts, saveProduct } from '@/lib/catalog';
import { kindLabels, money, newProduct, statusLabels, type Product, type ProductInput, type InventoryMovement } from '@/lib/catalog-model';

export const Route = createFileRoute('/admin')({ head: () => ({ meta: [{ title: 'Administracion | JTP' }, { name: 'robots', content: 'noindex,nofollow' }] }), component: AdminPage });

function AdminPage() {
  const { user, loading, signOut } = useAuth();
  const [access, setAccess] = useState<{ userId: string; allowed: boolean } | null>(null);
  const [error, setError] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [pending, setPending] = useState(false);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [category, setCategory] = useState('all');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [editor, setEditor] = useState<{ initial: ProductInput; existing: Product | undefined } | null>(null);
  const [tab, setTab] = useState<'products' | 'inventory'>('products');
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const allowed = !!user && access?.userId === user.id && access.allowed;

  useEffect(() => {
    if (!user) return;
    let active = true;
    setError('');
    supabase.from('store_roles').select('role').eq('user_id', user.id).maybeSingle().then(({ data, error: cause }) => {
      if (!active) return;
      if (cause) setError(catalogError(cause));
      setAccess({ userId: user.id, allowed: !cause && !!data });
    });
    return () => { active = false; };
  }, [user?.id]);

  async function reload() {
    setPending(true); setError('');
    try {
      const data = await listProducts(); setProducts(data); setSelected([]);
      const { data: history, error: cause } = await supabase.from('inventory_movements').select('*').order('created_at', { ascending: false }).limit(100);
      if (cause) throw cause;
      setMovements(history);
    } catch (cause) { setError(catalogError(cause)); }
    finally { setPending(false); }
  }
  useEffect(() => { if (allowed) void reload(); }, [allowed]);

  async function bulk(nextStatus: ProductInput['status'], ids = selected) {
    if (!ids.length || !window.confirm(`Cambiar ${ids.length} producto(s) a ${statusLabels[nextStatus]}?`)) return;
    setPending(true); setError('');
    let count = 0;
    const failures: string[] = [];
    for (const product of products.filter(item => ids.includes(item.id))) {
      try { await saveProduct({ ...product, status: nextStatus }, product); count++; }
      catch (cause) { failures.push(`${product.name}: ${catalogError(cause)}`); }
    }
    await reload();
    if (count) toast.success(`${count} producto(s) actualizados.`);
    if (failures.length) setError(failures.join(' '));
  }

  if (loading || (user && access?.userId !== user.id)) return <main className="p-8" role="status">Verificando acceso...</main>;
  if (!user || !allowed) return <main className="mx-auto max-w-lg space-y-5 px-5 py-20"><Link to="/" className="text-xl font-semibold">JTP</Link><h1 className="text-2xl font-semibold">Administracion de tienda</h1><p>{user ? 'Tu cuenta no tiene acceso a la administracion.' : 'Inicia sesion con tu cuenta de administrador.'}</p>{error && <p role="alert" className="text-destructive">{error}</p>}<Button asChild><Link to="/auth">Iniciar sesion</Link></Button>{user && <Button variant="outline" onClick={() => signOut()}>Cerrar sesion</Button>}</main>;

  const categories = [...new Set(products.map(product => product.category).filter(Boolean))].sort();
  const filtered = products.filter(product => (status === 'all' ? product.status !== 'archived' : product.status === status) && (category === 'all' || product.category === category) && `${product.name} ${product.sku}`.toLowerCase().includes(query.toLowerCase()));
  const pages = Math.max(1, Math.ceil(filtered.length / 20));
  const currentPage = Math.min(page, pages - 1);
  const visible = filtered.slice(currentPage * 20, currentPage * 20 + 20);
  const activeProducts = products.filter(product => product.status !== 'archived');

  return <main className="min-h-screen bg-background text-foreground">
    <header className="border-b border-border"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-4"><Link to="/" className="text-xl font-semibold">JTP / Tienda</Link><div className="flex min-w-0 items-center gap-3"><span className="max-w-48 truncate text-sm text-muted-foreground">{user.email}</span><Button size="icon" variant="ghost" aria-label="Cerrar sesion" title="Cerrar sesion" disabled={!!editor} onClick={() => signOut()}><LogOut /></Button></div></div></header>
    <div className="mx-auto max-w-7xl px-5 py-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-semibold">Gestion de tienda</h1><div className="flex gap-2"><Button variant="outline" size="icon" aria-label="Actualizar catalogo" title="Actualizar catalogo" disabled={pending || !!editor} onClick={reload}><RefreshCw className={pending ? 'animate-spin' : ''} /></Button><Button disabled={pending || !!editor} onClick={() => { setTab('products'); setEditor({ initial: newProduct(), existing: undefined }); }}><Plus />Nuevo producto</Button></div></div>
      <div className="mb-6 grid grid-cols-2 gap-4 border-y border-border py-4 md:grid-cols-4">{[['Productos activos', activeProducts.length], ['Publicados', activeProducts.filter(p => p.status === 'published').length], ['Unidades', activeProducts.filter(p => p.kind === 'stock').reduce((sum, p) => sum + p.stock, 0)], ['Stock bajo', activeProducts.filter(p => p.kind === 'stock' && p.stock <= p.low_stock_threshold).length]].map(([label, value]) => <div key={label}><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-semibold">{value}</p></div>)}</div>
      <nav className="mb-5 flex gap-2" aria-label="Modulos"><Button variant={tab === 'products' ? 'default' : 'outline'} onClick={() => setTab('products')}>Productos</Button><Button variant={tab === 'inventory' ? 'default' : 'outline'} disabled={!!editor} onClick={() => setTab('inventory')}>Inventario</Button></nav>
      {error && <p role="alert" className="mb-4 border border-destructive p-3 text-sm text-destructive">{error}</p>}
      {products.length === 1000 && <p className="mb-3 text-sm">Mostrando los 1000 productos modificados mas recientemente.</p>}
      {tab === 'inventory' ? <section><h2 className="mb-4 text-lg font-semibold">Ultimos movimientos</h2><Table><TableHeader><TableRow><TableHead>Fecha</TableHead><TableHead>Producto</TableHead><TableHead>Anterior</TableHead><TableHead>Actual</TableHead><TableHead>Motivo</TableHead></TableRow></TableHeader><TableBody>{movements.map(movement => <TableRow key={movement.id}><TableCell>{new Date(movement.created_at).toLocaleString('es')}</TableCell><TableCell>{products.find(p => p.id === movement.product_id)?.name ?? movement.product_id}</TableCell><TableCell>{movement.previous_stock}</TableCell><TableCell>{movement.new_stock}</TableCell><TableCell>{movement.reason === 'Initial stock' ? 'Stock inicial' : 'Ajuste de catalogo'}</TableCell></TableRow>)}</TableBody></Table>{!movements.length && <p className="py-8 text-muted-foreground">Sin movimientos.</p>}</section> : <div className={`grid gap-6 ${editor ? 'lg:grid-cols-[minmax(0,1fr)_minmax(320px,440px)]' : ''}`}>
        <section className="min-w-0">
          <div className="mb-4 flex flex-wrap gap-2"><div className="relative min-w-40 flex-1"><Search className="absolute left-3 top-3 size-4 text-muted-foreground" /><Input aria-label="Buscar productos" placeholder="Nombre o SKU" className="pl-9" value={query} onChange={e => { setQuery(e.target.value); setPage(0); }} /></div><select aria-label="Filtrar estado" className="h-10 max-w-full border border-input bg-background px-2 text-sm" value={status} onChange={e => { setStatus(e.target.value); setPage(0); }}><option value="all">Activos</option>{Object.entries(statusLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select><select aria-label="Filtrar categoria" className="h-10 max-w-full border border-input bg-background px-2 text-sm" value={category} onChange={e => { setCategory(e.target.value); setPage(0); }}><option value="all">Todas las categorias</option>{categories.map(value => <option key={value}>{value}</option>)}</select></div>
          {selected.length > 0 && <div className="mb-3 flex flex-wrap items-center gap-2"><span className="text-sm">{selected.length} seleccionados</span><Button size="sm" variant="outline" disabled={pending || !!editor} onClick={() => bulk('published')}>Publicar</Button><Button size="sm" variant="outline" disabled={pending || !!editor} onClick={() => bulk('paused')}>Pausar</Button></div>}
          <Table><TableHeader><TableRow><TableHead><Checkbox aria-label="Seleccionar pagina" checked={visible.length > 0 && visible.every(p => selected.includes(p.id))} onCheckedChange={checked => setSelected(checked ? [...new Set([...selected, ...visible.map(p => p.id)])] : selected.filter(id => !visible.some(p => p.id === id)))} /></TableHead><TableHead>Producto</TableHead><TableHead>Precio</TableHead><TableHead>Stock</TableHead><TableHead>Estado</TableHead><TableHead>Acciones</TableHead></TableRow></TableHeader><TableBody>{visible.map(product => <TableRow key={product.id}>
            <TableCell><Checkbox aria-label={`Seleccionar ${product.name}`} checked={selected.includes(product.id)} onCheckedChange={checked => setSelected(checked ? [...selected, product.id] : selected.filter(id => id !== product.id))} /></TableCell>
            <TableCell><div className="flex items-center gap-3">{product.images[0] ? <img src={imageUrl(product.images[0].path)} alt="" className="size-12 shrink-0 object-cover" /> : <Package className="size-10 shrink-0 text-muted-foreground" />}<div className="min-w-32 max-w-64"><p className="break-words font-medium">{product.name}</p><p className="text-xs text-muted-foreground">{product.sku} · {product.category}</p></div></div></TableCell>
            <TableCell className="whitespace-nowrap">{money(product.price, product.currency)}</TableCell><TableCell>{product.kind === 'stock' ? <span className={product.stock <= product.low_stock_threshold ? 'text-destructive' : ''}>{product.stock}</span> : kindLabels[product.kind]}</TableCell><TableCell>{statusLabels[product.status]}</TableCell>
            <TableCell><div className="flex"><Button size="icon" variant="ghost" title="Editar producto" aria-label={`Editar ${product.name}`} disabled={pending || !!editor} onClick={() => setEditor({ initial: product, existing: product })}><Pencil /></Button><Button size="icon" variant="ghost" title="Duplicar producto" aria-label={`Duplicar ${product.name}`} disabled={pending || !!editor} onClick={() => setEditor({ initial: { ...product, name: `${product.name.slice(0, 150)} (copia)`, sku: '', status: 'draft', stock: 0 }, existing: undefined })}><Copy /></Button><Button size="icon" variant="ghost" title="Archivar producto" aria-label={`Archivar ${product.name}`} disabled={pending || !!editor || product.status === 'archived'} onClick={() => bulk('archived', [product.id])}><Archive /></Button></div></TableCell>
          </TableRow>)}</TableBody></Table>
          {!visible.length && <p role="status" className="py-12 text-center text-muted-foreground">{pending ? 'Cargando productos...' : 'No hay productos para mostrar.'}</p>}
          <div className="mt-4 flex items-center justify-between gap-2"><span className="text-sm text-muted-foreground">{filtered.length} productos · {currentPage + 1}/{pages}</span><div className="flex gap-1"><Button variant="outline" size="icon" aria-label="Pagina anterior" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}><ArrowLeft /></Button><Button variant="outline" size="icon" aria-label="Pagina siguiente" disabled={currentPage + 1 >= pages} onClick={() => setPage(currentPage + 1)}><ArrowRight /></Button></div></div>
        </section>
        {editor && <ProductEditor key={editor.existing?.id ?? 'new'} initial={editor.initial} existing={editor.existing} userId={user.id} onClose={() => setEditor(null)} onSaved={product => { setProducts(current => [product, ...current.filter(p => p.id !== product.id)]); setEditor(null); void reload(); }} />}
      </div>}
    </div>
  </main>;
}
