import { useEffect, useState } from 'react';
import { Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ProductGallery } from './product-gallery';
import { catalogError, saveProduct } from '@/lib/catalog';
import { kindLabels, statusLabels, type Product, type ProductInput } from '@/lib/catalog-model';
import { toast } from 'sonner';

export function ProductEditor({ initial, existing, userId, onSaved, onClose }: {
  initial: ProductInput; existing: Product | undefined; userId: string; onSaved: (product: Product) => void; onClose: () => void;
}) {
  const [draft, setDraft] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const dirty = JSON.stringify(initial) !== JSON.stringify(draft);
  const busy = saving || uploading;
  useEffect(() => {
    const handle = (event: BeforeUnloadEvent) => { if (dirty || uploading) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('beforeunload', handle);
    return () => window.removeEventListener('beforeunload', handle);
  }, [dirty, uploading]);

  function update<K extends keyof ProductInput>(key: K, value: ProductInput[K]) { setDraft(current => ({ ...current, [key]: value })); }
  function close() { if (!busy && (!dirty || window.confirm('Descartar los cambios sin guardar?'))) onClose(); }

  return <section className="min-w-0 border-l border-border lg:pl-6" aria-label="Editor de producto">
    <div className="mb-5 flex items-center justify-between gap-3"><h2 className="text-xl font-semibold">{existing ? 'Editar producto' : 'Nuevo producto'}</h2><Button variant="ghost" size="icon" title="Cerrar editor" aria-label="Cerrar editor" disabled={busy} onClick={close}><X /></Button></div>
    <form className="space-y-4" onSubmit={async event => {
      event.preventDefault(); setSaving(true); setError('');
      try { const saved = await saveProduct(draft, existing); toast.success('Producto guardado.'); onSaved(saved); }
      catch (cause) { setError(cause instanceof Error && cause.name === 'ZodError' ? 'Revisa los campos. Para publicar necesitas categoria y portada.' : catalogError(cause)); }
      finally { setSaving(false); }
    }}>
      <fieldset disabled={busy} className="space-y-4 disabled:opacity-70">
        <label className="block text-sm">Nombre<Input autoFocus required maxLength={160} value={draft.name} onChange={e => update('name', e.target.value)} /></label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><label className="block text-sm">SKU<Input required maxLength={80} value={draft.sku} onChange={e => update('sku', e.target.value)} /></label><label className="block text-sm">Categoria<Input maxLength={100} value={draft.category} onChange={e => update('category', e.target.value)} /></label></div>
        <label className="block text-sm">Tipo<select className="mt-1 h-10 w-full border border-input bg-background px-2" value={draft.kind} onChange={e => update('kind', e.target.value as ProductInput['kind'])}>{Object.entries(kindLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        <div className="grid grid-cols-2 gap-3"><label className="block text-sm">Precio<Input type="number" required min="0" max="999999999.99" step="0.01" value={draft.price} onChange={e => update('price', e.target.valueAsNumber)} /></label><label className="block text-sm">Moneda<select className="mt-1 h-10 w-full border border-input bg-background px-2" value={draft.currency} onChange={e => update('currency', e.target.value as ProductInput['currency'])}>{['CAD', 'USD', 'MXN', 'EUR'].map(currency => <option key={currency}>{currency}</option>)}</select></label></div>
        {draft.kind === 'stock' && <div className="grid grid-cols-2 gap-3"><label className="block text-sm">Existencias<Input type="number" required min="0" step="1" value={draft.stock} onChange={e => update('stock', e.target.valueAsNumber)} /></label><label className="block text-sm">Alerta de stock<Input type="number" required min="0" step="1" value={draft.low_stock_threshold} onChange={e => update('low_stock_threshold', e.target.valueAsNumber)} /></label></div>}
        <label className="block text-sm">Descripcion<Textarea rows={4} maxLength={10000} value={draft.description} onChange={e => update('description', e.target.value)} /></label>
        <label className="block text-sm">Estado<select className="mt-1 h-10 w-full border border-input bg-background px-2" value={draft.status} onChange={e => update('status', e.target.value as ProductInput['status'])}>{Object.entries(statusLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      </fieldset>
      <ProductGallery images={draft.images} onChange={images => update('images', images)} userId={userId} disabled={saving} onBusy={setUploading} />
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="flex flex-wrap gap-2"><Button type="submit" disabled={busy}><Save />{saving ? 'Guardando...' : 'Guardar producto'}</Button><Button type="button" variant="outline" disabled={busy} onClick={close}>Cancelar</Button></div>
    </form>
  </section>;
}
