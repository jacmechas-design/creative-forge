import { supabase } from '@/integrations/supabase/client';
import { productSchema, validateImage, type Product, type ProductInput } from './catalog-model';

export function catalogError(error: unknown): string {
  const detail = error as { code?: string; message?: string };
  if (detail?.code === '23505') return 'Ya existe un producto con ese SKU.';
  if (['42P01', 'PGRST205'].includes(detail?.code ?? '')) return 'El catalogo no esta disponible. Contacta al administrador.';
  return detail?.message || 'No se pudo completar la operacion. Intenta nuevamente.';
}

export async function listProducts() {
  const { data, error } = await supabase.from('products').select('*').order('updated_at', { ascending: false }).limit(1000);
  if (error) throw error;
  return data;
}

export async function saveProduct(input: ProductInput, existing?: Product) {
  const value = productSchema.parse({ ...input, stock: input.kind === 'stock' ? input.stock : 0 });
  const query = existing
    ? supabase.from('products').update(value).eq('id', existing.id).eq('version', existing.version)
    : supabase.from('products').insert(value);
  const { data, error } = await query.select().maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('Otro usuario modifico este producto. Recarga el catalogo antes de guardar.');
  return data;
}

export const imageUrl = (path: string) => supabase.storage.from('product-media').getPublicUrl(path).data.publicUrl;

export async function uploadImage(file: File, userId: string) {
  validateImage(file);
  const bitmap = await createImageBitmap(file);
  const valid = bitmap.width >= 100 && bitmap.height >= 100 && bitmap.width <= 12000 && bitmap.height <= 12000;
  bitmap.close();
  if (!valid) throw new Error('Las dimensiones deben estar entre 100 y 12000 pixeles por lado.');
  const extension = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[file.type];
  const path = `${userId}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from('product-media').upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;
  return { path, alt: file.name.replace(/\.[^.]+$/, '').slice(0, 300) };
}
