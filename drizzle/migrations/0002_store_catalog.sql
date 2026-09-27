CREATE TABLE public.store_roles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('admin', 'operator'))
);
ALTER TABLE public.store_roles ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.store_roles TO authenticated;
GRANT ALL ON public.store_roles TO service_role;
CREATE POLICY "Read own store role" ON public.store_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE FUNCTION public.is_store_staff() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (SELECT 1 FROM public.store_roles WHERE user_id = auth.uid() AND role IN ('admin', 'operator'));
$$;
REVOKE ALL ON FUNCTION public.is_store_staff() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_store_staff() TO anon, authenticated, service_role;

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 160),
  sku text NOT NULL CHECK (length(btrim(sku)) BETWEEN 1 AND 80),
  category text NOT NULL DEFAULT '' CHECK (length(category) <= 100),
  description text NOT NULL DEFAULT '' CHECK (length(description) <= 10000),
  kind text NOT NULL DEFAULT 'stock' CHECK (kind IN ('stock', 'service', 'made_to_order')),
  price numeric(12,2) NOT NULL DEFAULT 0 CHECK (price >= 0 AND price < 1000000000),
  currency text NOT NULL DEFAULT 'CAD' CHECK (currency IN ('CAD', 'USD', 'MXN', 'EUR')),
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  low_stock_threshold integer NOT NULL DEFAULT 5 CHECK (low_stock_threshold >= 0),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'paused', 'archived')),
  images jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(images) = 'array' AND jsonb_array_length(images) <= 20),
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX products_unique_sku ON public.products (lower(btrim(sku)));
CREATE INDEX products_status_category ON public.products (status, category);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.products TO anon, authenticated;
GRANT INSERT, UPDATE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
CREATE POLICY "Published catalog" ON public.products FOR SELECT TO anon, authenticated USING (status = 'published' OR public.is_store_staff());
CREATE POLICY "Staff create products" ON public.products FOR INSERT TO authenticated WITH CHECK (public.is_store_staff());
CREATE POLICY "Staff update products" ON public.products FOR UPDATE TO authenticated USING (public.is_store_staff()) WITH CHECK (public.is_store_staff());

CREATE TABLE public.inventory_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id),
  previous_stock integer NOT NULL,
  new_stock integer NOT NULL,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.inventory_movements TO authenticated;
GRANT ALL ON public.inventory_movements TO service_role;
CREATE POLICY "Staff read inventory history" ON public.inventory_movements FOR SELECT TO authenticated USING (public.is_store_staff());

CREATE FUNCTION public.validate_store_product() RETURNS trigger
LANGUAGE plpgsql SET search_path = '' AS $$
DECLARE img jsonb;
BEGIN
  NEW.name := btrim(NEW.name);
  NEW.sku := btrim(NEW.sku);
  IF NEW.kind <> 'stock' THEN NEW.stock := 0; END IF;
  FOR img IN SELECT value FROM jsonb_array_elements(NEW.images) LOOP
    IF jsonb_typeof(img) <> 'object' OR NOT (img ? 'path' AND img ? 'alt')
       OR jsonb_typeof(img->'path') <> 'string' OR jsonb_typeof(img->'alt') <> 'string'
       OR (img->>'path') !~ '^[a-f0-9-]{36}/[a-f0-9-]{36}\.(jpg|png|webp)$'
       OR length(img->>'alt') > 300 THEN
      RAISE EXCEPTION 'Invalid product image';
    END IF;
  END LOOP;
  IF NEW.status = 'published' AND (NEW.category = '' OR jsonb_array_length(NEW.images) = 0) THEN
    RAISE EXCEPTION 'Published products require a category and an image';
  END IF;
  IF TG_OP = 'UPDATE' THEN
    NEW.version := OLD.version + 1;
    NEW.created_at := OLD.created_at;
  ELSE
    NEW.version := 1;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
CREATE TRIGGER validate_store_product BEFORE INSERT OR UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.validate_store_product();

CREATE FUNCTION public.record_store_inventory() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.kind = 'stock' THEN
      INSERT INTO public.inventory_movements(product_id, previous_stock, new_stock, actor_id, reason)
      VALUES (NEW.id, 0, NEW.stock, auth.uid(), 'Initial stock');
    END IF;
  ELSIF OLD.stock IS DISTINCT FROM NEW.stock THEN
    INSERT INTO public.inventory_movements(product_id, previous_stock, new_stock, actor_id, reason)
    VALUES (NEW.id, OLD.stock, NEW.stock, auth.uid(), 'Catalog adjustment');
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER record_store_inventory AFTER INSERT OR UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.record_store_inventory();

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('product-media', 'product-media', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']);
CREATE POLICY "Staff upload product media" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'product-media' AND public.is_store_staff() AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Staff read product media" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'product-media' AND public.is_store_staff());

DROP POLICY "Users can update own quotes" ON public.quotes;
DROP POLICY "Users can create own quotes" ON public.quotes;
CREATE POLICY "Users submit pending quotes" ON public.quotes FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND status = 'pending_review' AND estimated_price >= 0
  AND (file_path IS NULL OR split_part(file_path, '/', 1) = auth.uid()::text));
CREATE POLICY "Staff read quotes" ON public.quotes FOR SELECT TO authenticated USING (public.is_store_staff());
CREATE POLICY "Staff update quotes" ON public.quotes FOR UPDATE TO authenticated USING (public.is_store_staff()) WITH CHECK (public.is_store_staff());
CREATE POLICY "Staff read design files" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'design-files' AND public.is_store_staff());
