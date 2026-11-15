-- Portfolio: finished projects with photos and videos, shown publicly at /portfolio.
-- Requires 20261114200000_restore_store_schema.sql (uses public.is_staff()). Safe to re-run.

CREATE TABLE IF NOT EXISTS public.portfolio_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (length(btrim(title)) BETWEEN 1 AND 160),
  description text NOT NULL DEFAULT '' CHECK (length(description) <= 4000),
  service text NOT NULL DEFAULT 'otro' CHECK (service IN ('uv', 'laser', '3d', 'otro')),
  -- [{ "type": "image" | "video", "path": "<storage path>", "url": "<public url>" }]
  media jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(media) = 'array' AND jsonb_array_length(media) <= 20),
  external_url text CHECK (external_url IS NULL OR external_url ~ '^https://'),
  featured boolean NOT NULL DEFAULT false,
  published boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS portfolio_items_public ON public.portfolio_items (published, sort_order, created_at DESC);

ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.portfolio_items TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.portfolio_items TO authenticated;
GRANT ALL ON public.portfolio_items TO service_role;

DROP POLICY IF EXISTS "Public reads published portfolio" ON public.portfolio_items;
CREATE POLICY "Public reads published portfolio" ON public.portfolio_items FOR SELECT TO anon, authenticated
  USING (published OR public.is_staff());
DROP POLICY IF EXISTS "Staff manage portfolio" ON public.portfolio_items;
CREATE POLICY "Staff manage portfolio" ON public.portfolio_items FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());

DROP TRIGGER IF EXISTS portfolio_items_updated_at ON public.portfolio_items;
CREATE TRIGGER portfolio_items_updated_at BEFORE UPDATE ON public.portfolio_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Public bucket: anyone can view the media, only staff can upload or delete.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('portfolio-media', 'portfolio-media', true, 52428800,
        ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime'])
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Staff upload portfolio media" ON storage.objects;
CREATE POLICY "Staff upload portfolio media" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'portfolio-media' AND public.is_staff());
DROP POLICY IF EXISTS "Staff delete portfolio media" ON storage.objects;
CREATE POLICY "Staff delete portfolio media" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'portfolio-media' AND public.is_staff());
DROP POLICY IF EXISTS "Public reads portfolio media" ON storage.objects;
CREATE POLICY "Public reads portfolio media" ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'portfolio-media');
