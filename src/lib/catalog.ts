import { PRODUCTS, type Cat, type LeadKey, type Product } from "@/data/products";

/** slug -> bundled image imported at build time */
export const IMAGE_MAP: Record<string, string> = Object.fromEntries(
  PRODUCTS.map((p) => [p.id, p.img])
);

export interface ProductRow {
  id: string;
  slug: string;
  cat: string;
  price_cad: number | string;
  image_key: string | null;
  image_url: string | null;
  popular: boolean;
  published: boolean;
  rating: number | string;
  review_count: number;
  dimensions: string | null;
  lead: string;
  sort_order: number;
  stock: number | null;
  name_en: string;
  name_fr: string | null;
  name_es: string | null;
  tag_en: string | null;
  tag_fr: string | null;
  tag_es: string | null;
  desc_en: string | null;
  desc_fr: string | null;
  desc_es: string | null;
  material_en: string | null;
  material_fr: string | null;
  material_es: string | null;
  created_at?: string;
  updated_at?: string;
}

export type ShopProduct = Product & {
  rowId?: string;
  published: boolean;
  sortOrder: number;
  stock: number | null;
};

const tri = (en: string | null, fr: string | null, es: string | null) => ({
  en: en ?? "",
  fr: fr ?? en ?? "",
  es: es ?? en ?? "",
});

export function rowToProduct(r: ProductRow): ShopProduct {
  return {
    rowId: r.id,
    id: r.slug,
    cat: r.cat as Cat,
    price: Number(r.price_cad),
    img: (r.image_key ? IMAGE_MAP[r.image_key] : undefined) ?? r.image_url ?? IMAGE_MAP[r.slug] ?? "",
    popular: r.popular,
    published: r.published,
    sortOrder: r.sort_order ?? 0,
    stock: r.stock,
    rating: Number(r.rating),
    reviewCount: r.review_count,
    dimensions: r.dimensions ?? "",
    lead: (r.lead as LeadKey) ?? "d23",
    name: tri(r.name_en, r.name_fr, r.name_es),
    tag: tri(r.tag_en, r.tag_fr, r.tag_es),
    desc: tri(r.desc_en, r.desc_fr, r.desc_es),
    material: tri(r.material_en, r.material_fr, r.material_es),
  };
}

/** Rows used by the "import starter catalogue" action in the admin panel. */
export const seedRows = () =>
  PRODUCTS.map((p, i) => ({
    slug: p.id,
    cat: p.cat,
    price_cad: p.price,
    image_key: p.id,
    popular: p.popular,
    published: true,
    rating: p.rating,
    review_count: p.reviewCount,
    dimensions: p.dimensions,
    lead: p.lead,
    sort_order: i * 10,
    name_en: p.name.en,
    name_fr: p.name.fr,
    name_es: p.name.es,
    tag_en: p.tag.en,
    tag_fr: p.tag.fr,
    tag_es: p.tag.es,
    desc_en: p.desc.en,
    desc_fr: p.desc.fr,
    desc_es: p.desc.es,
    material_en: p.material.en,
    material_fr: p.material.fr,
    material_es: p.material.es,
  }));

export const STATIC_PRODUCTS: ShopProduct[] = PRODUCTS.map((p, i) => ({
  ...p,
  published: true,
  sortOrder: i * 10,
  stock: null,
}));
