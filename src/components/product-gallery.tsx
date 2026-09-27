import { useState } from 'react';
import { ArrowLeft, ArrowRight, ImagePlus, Star, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { imageUrl, uploadImage, catalogError } from '@/lib/catalog';
import type { ProductInput } from '@/lib/catalog-model';
import { supabase } from '@/integrations/supabase/client';

type Media = ProductInput['images'];
export function ProductGallery({ images, onChange, userId, disabled, onBusy }: {
  images: Media; onChange: (images: Media) => void; userId: string; disabled: boolean; onBusy: (busy: boolean) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [library, setLibrary] = useState<Media | null>(null);
  const [dragged, setDragged] = useState<number | null>(null);

  async function upload(files: File[]) {
    if (disabled || busy) return;
    if (images.length + files.length > 20) { setErrors(['El limite es de 20 imagenes por producto.']); return; }
    setBusy(true); onBusy(true); setErrors([]);
    const added: Media = [];
    const failures: string[] = [];
    try {
      for (const [index, file] of files.entries()) {
        setProgress(`${index + 1} / ${files.length}`);
        try { added.push(await uploadImage(file, userId)); }
        catch (error) { failures.push(`${file.name}: ${catalogError(error)}`); }
      }
      onChange([...images, ...added]);
      setErrors(failures);
    } finally { setBusy(false); onBusy(false); setProgress(''); }
  }

  function move(from: number, to: number) {
    if (disabled || busy || to < 0 || to >= images.length) return;
    const next = [...images];
    const [item] = next.splice(from, 1);
    if (item) next.splice(to, 0, item);
    onChange(next);
  }

  async function openLibrary() {
    setErrors([]);
    const { data, error } = await supabase.storage.from('product-media').list(userId, { limit: 100, sortBy: { column: 'created_at', order: 'desc' } });
    if (error) { setErrors([catalogError(error)]); return; }
    setLibrary(data.filter(item => /\.(jpg|png|webp)$/.test(item.name)).map(item => ({ path: `${userId}/${item.name}`, alt: '' })));
  }

  return <section aria-label="Galeria del producto" className="space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">Galeria ({images.length}/20)</h3><Button type="button" variant="outline" disabled={disabled || busy} onClick={openLibrary}>Biblioteca</Button></div>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {images.map((item, index) => <div key={item.path} draggable={!disabled && !busy} onDragStart={() => setDragged(index)} onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); event.stopPropagation(); if (dragged !== null) move(dragged, index); setDragged(null); }} className="min-w-0 border border-border p-2">
        <a href={imageUrl(item.path)} target="_blank" rel="noreferrer" aria-label={`Ampliar imagen ${index + 1}`}><img src={imageUrl(item.path)} alt={item.alt} className="aspect-square w-full object-contain bg-secondary" loading="lazy" /></a>
        <div className="my-2 flex flex-wrap justify-between gap-1">
          <Button type="button" size="icon" variant={index === 0 ? 'default' : 'outline'} disabled={disabled || busy || index === 0} title="Usar como portada" aria-label="Usar como portada" onClick={() => move(index, 0)}><Star /></Button>
          <Button type="button" size="icon" variant="outline" disabled={disabled || busy || index === 0} title="Mover antes" aria-label="Mover antes" onClick={() => move(index, index - 1)}><ArrowLeft /></Button>
          <Button type="button" size="icon" variant="outline" disabled={disabled || busy || index === images.length - 1} title="Mover despues" aria-label="Mover despues" onClick={() => move(index, index + 1)}><ArrowRight /></Button>
          <Button type="button" size="icon" variant="outline" disabled={disabled || busy} title="Retirar del producto" aria-label="Retirar del producto" onClick={() => onChange(images.filter((_, i) => i !== index))}><Trash2 /></Button>
        </div>
        <label className="text-xs">Texto alternativo<Input value={item.alt} maxLength={300} disabled={disabled || busy} onChange={event => onChange(images.map((image, i) => i === index ? { ...image, alt: event.target.value } : image))} /></label>
      </div>)}
    </div>
    <div className="border border-dashed border-border p-4" onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); void upload(Array.from(event.dataTransfer.files)); }}>
      <label className="flex flex-wrap items-center gap-2 text-sm"><ImagePlus className="size-4" /> Agregar imagenes<input className="block w-full min-w-0 text-sm" aria-label="Agregar imagenes" type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={disabled || busy} onChange={event => { void upload(Array.from(event.target.files ?? [])); event.target.value = ''; }} /></label>
      {busy && <p role="status" className="mt-2 text-sm">Subiendo {progress}</p>}
    </div>
    {errors.map(error => <p key={error} role="alert" className="text-sm text-destructive">{error}</p>)}
    {library !== null && <div className="space-y-2 border-t border-border pt-3"><div className="flex items-center justify-between"><h4 className="text-sm font-medium">Mis archivos</h4><Button type="button" variant="ghost" onClick={() => setLibrary(null)}>Cerrar</Button></div>{!library.length && <p className="text-sm text-muted-foreground">Sin archivos.</p>}<div className="grid grid-cols-3 gap-2">{library.map(item => <button key={item.path} type="button" disabled={disabled || busy || images.length >= 20 || images.some(image => image.path === item.path)} title="Agregar al producto" onClick={() => onChange([...images, item])} className="disabled:opacity-30"><img src={imageUrl(item.path)} alt="Agregar imagen de biblioteca" className="aspect-square w-full object-cover" loading="lazy" /></button>)}</div></div>}
  </section>;
}
