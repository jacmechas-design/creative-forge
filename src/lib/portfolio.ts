import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tri } from "@/i18n/lang";

export type PortfolioService = "uv" | "laser" | "3d" | "otro";
export type PortfolioMedia = { type: "image" | "video"; path: string; url: string };

export interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  service: PortfolioService;
  media: PortfolioMedia[];
  external_url: string | null;
  featured: boolean;
  published: boolean;
  sort_order: number;
  created_at: string;
}

export const PORTFOLIO_BUCKET = "portfolio-media";
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

export const SERVICE_LABELS: Record<PortfolioService, Tri> = {
  uv: { en: "UV printing", fr: "Impression UV", es: "Impresión UV" },
  laser: { en: "Laser", fr: "Laser", es: "Láser" },
  "3d": { en: "3D printing", fr: "Impression 3D", es: "Impresión 3D" },
  otro: { en: "Other", fr: "Autre", es: "Otro" },
};

/**
 * `portfolio_items` is created by a migration and is not in the generated DB types yet,
 * so it is reached through this narrow, typed view of the client.
 */
type Res<T> = PromiseLike<{ data: T | null; error: { message: string } | null }>;
type Table = {
  select: (cols: string) => {
    order: (
      col: string,
      o: { ascending: boolean },
    ) => {
      order: (
        col: string,
        o: { ascending: boolean },
      ) => Res<PortfolioItem[]> & {
        eq: (col: string, v: boolean) => Res<PortfolioItem[]>;
      };
    };
  };
  insert: (row: Partial<PortfolioItem>) => {
    select: (c: string) => { single: () => Res<PortfolioItem> };
  };
  update: (row: Partial<PortfolioItem>) => { eq: (col: string, v: string) => Res<unknown> };
  delete: () => { eq: (col: string, v: string) => Res<unknown> };
};
export const portfolioTable = () =>
  (supabase as unknown as { from: (t: string) => Table }).from("portfolio_items");

const normalize = (rows: PortfolioItem[] | null) =>
  (rows ?? []).map((r) => ({ ...r, media: Array.isArray(r.media) ? r.media : [] }));

async function fetchPortfolio(includeHidden: boolean): Promise<PortfolioItem[]> {
  const base = portfolioTable()
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  const { data, error } = await (includeHidden ? base : base.eq("published", true));
  if (error) throw new Error(error.message);
  return normalize(data);
}

/** Published projects for the public site. Empty (not an error) if the table is missing. */
export function usePortfolio() {
  return useQuery({
    queryKey: ["portfolio", "public"],
    queryFn: () => fetchPortfolio(false).catch(() => [] as PortfolioItem[]),
    staleTime: 30_000,
  });
}

export function useAdminPortfolio() {
  return useQuery({ queryKey: ["portfolio", "admin"], queryFn: () => fetchPortfolio(true) });
}

/** Uploads one photo or video to the public portfolio bucket. */
export async function uploadPortfolioMedia(file: File): Promise<PortfolioMedia> {
  const isVideo = VIDEO_TYPES.includes(file.type);
  const isImage = IMAGE_TYPES.includes(file.type);
  if (!isVideo && !isImage)
    throw new Error("Formato no permitido. Usa JPG, PNG, WEBP, MP4, WEBM o MOV.");
  if (file.size > (isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES)) {
    throw new Error(isVideo ? "El video pesa más de 50 MB." : "La foto pesa más de 10 MB.");
  }
  const ext = (file.name.split(".").pop() || (isVideo ? "mp4" : "jpg"))
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from(PORTFOLIO_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from(PORTFOLIO_BUCKET).getPublicUrl(path);
  return { type: isVideo ? "video" : "image", path, url: data.publicUrl };
}

export async function removePortfolioMedia(paths: string[]) {
  if (paths.length) await supabase.storage.from(PORTFOLIO_BUCKET).remove(paths);
}
