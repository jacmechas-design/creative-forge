import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { rowToProduct, STATIC_PRODUCTS, type ProductRow, type ShopProduct } from "@/lib/catalog";

async function fetchProducts(includeHidden: boolean): Promise<ShopProduct[]> {
  let q = supabase.from("products").select("*").order("sort_order", { ascending: true });
  if (!includeHidden) q = q.eq("published", true);
  const { data, error } = await q;
  if (error) throw error;
  return ((data ?? []) as unknown as ProductRow[]).map(rowToProduct);
}

/** Storefront catalogue: database rows, falling back to the bundled catalogue. */
export function useCatalog() {
  const query = useQuery({
    queryKey: ["catalog", "public"],
    queryFn: () => fetchProducts(false),
    staleTime: 30_000,
  });
  const rows = query.data ?? [];
  return {
    products: rows.length > 0 ? rows : STATIC_PRODUCTS,
    fromDatabase: rows.length > 0,
    isLoading: query.isLoading,
  };
}

/** Admin catalogue: every row, including hidden ones. */
export function useAdminCatalog() {
  return useQuery({
    queryKey: ["catalog", "admin"],
    queryFn: () => fetchProducts(true),
  });
}
