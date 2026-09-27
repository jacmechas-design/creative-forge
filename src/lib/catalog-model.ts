import { z } from 'zod';

export const productSchema = z.object({
  name: z.string().trim().min(1, 'Escribe el nombre.').max(160),
  sku: z.string().trim().min(1, 'Escribe el SKU.').max(80),
  category: z.string().trim().max(100),
  description: z.string().max(10000),
  kind: z.enum(['stock', 'service', 'made_to_order']),
  price: z.number().finite().min(0).max(999999999.99).multipleOf(0.01),
  currency: z.enum(['CAD', 'USD', 'MXN', 'EUR']),
  stock: z.number().int().min(0).max(2147483647),
  low_stock_threshold: z.number().int().min(0).max(2147483647),
  status: z.enum(['draft', 'published', 'paused', 'archived']),
  images: z.array(z.object({ path: z.string().regex(/^[a-f0-9-]{36}\/[a-f0-9-]{36}\.(jpg|png|webp)$/), alt: z.string().max(300) })).max(20),
}).superRefine((product, context) => {
  if (product.status === 'published' && (!product.category || !product.images.length)) {
    context.addIssue({ code: 'custom', message: 'Para publicar agrega una categoria y una imagen.' });
  }
});

export type ProductInput = z.infer<typeof productSchema>;
export type Product = ProductInput & { id: string; version: number; created_at: string; updated_at: string };
export type InventoryMovement = { id: string; product_id: string; previous_stock: number; new_stock: number; actor_id: string | null; reason: string; created_at: string };
export const statusLabels = { draft: 'Borrador', published: 'Publicado', paused: 'Pausado', archived: 'Archivado' };
export const kindLabels = { stock: 'Producto fisico', service: 'Servicio', made_to_order: 'Bajo pedido' };
export const newProduct = (): ProductInput => ({ name: '', sku: '', category: '', description: '', kind: 'stock', price: 0, currency: 'CAD', stock: 0, low_stock_threshold: 5, status: 'draft', images: [] });
export const money = (amount: number, currency: string) => new Intl.NumberFormat('es', { style: 'currency', currency }).format(amount);

export function validateImage(file: Pick<File, 'type' | 'size'>) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Solo se admiten JPG, PNG y WebP.');
  if (file.size > 5 * 1024 * 1024 || file.size === 0) throw new Error('Cada imagen debe pesar entre 1 byte y 5 MB.');
}
