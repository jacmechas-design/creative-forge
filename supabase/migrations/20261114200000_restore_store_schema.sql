-- Restores the tables the JTP site and admin panel use.
-- The connected database only had `profiles` and `quotes` (from the first migration);
-- products, site content, orders, messages, roles and UI settings were missing.
-- Safe to re-run: every step checks before creating, and nothing is dropped or deleted.

-- ── enums ───────────────────────────────────────────────
DO $$ BEGIN CREATE TYPE public.app_role AS ENUM ('admin', 'staff'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.request_status AS ENUM ('nuevo', 'en_proceso', 'cerrado'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE public.order_status AS ENUM ('nuevo', 'confirmado', 'produccion', 'listo', 'entregado', 'cancelado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── helpers ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger
LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END;
$$;

-- ── roles ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'staff',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- The store owner's account (same email the app treats as owner in src/hooks/useAuth.ts).
CREATE OR REPLACE FUNCTION public.is_owner() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT lower(coalesce(auth.jwt() ->> 'email', '')) = 'jptproducts1946@gmail.com';
$$;

CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT public.is_owner() OR public.has_role(auth.uid(), 'admin');
$$;

CREATE OR REPLACE FUNCTION public.is_staff() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT public.is_owner() OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid());
$$;

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role), public.is_owner(), public.is_admin(), public.is_staff() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role), public.is_owner(), public.is_admin(), public.is_staff()
  TO anon, authenticated, service_role;

DROP POLICY IF EXISTS "Read own roles or admin reads all" ON public.user_roles;
CREATE POLICY "Read own roles or admin reads all" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS "Admins add roles" ON public.user_roles;
CREATE POLICY "Admins add roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Admins remove roles" ON public.user_roles;
CREATE POLICY "Admins remove roles" ON public.user_roles FOR DELETE TO authenticated USING (public.is_admin());

-- Give the owner the admin role if that account already exists.
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users WHERE lower(email) = 'jptproducts1946@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- ── profiles (existing table: add what the Team page reads) ──
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
UPDATE public.profiles p SET email = u.email FROM auth.users u WHERE u.id = p.id AND p.email IS NULL;

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''), NEW.email)
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP POLICY IF EXISTS "Staff read all profiles" ON public.profiles;
CREATE POLICY "Staff read all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.is_staff());

-- ── site content (texts, colours, categories, page layout, admin cost tracker) ──
CREATE TABLE IF NOT EXISTS public.app_content (
  id text PRIMARY KEY CHECK (length(id) BETWEEN 1 AND 100),
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.app_content ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.app_content TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.app_content TO authenticated;
GRANT ALL ON public.app_content TO service_role;
-- Visitors only see the public site documents; everything else (e.g. cost_tracker) is staff-only.
DROP POLICY IF EXISTS "Public reads site content" ON public.app_content;
CREATE POLICY "Public reads site content" ON public.app_content FOR SELECT TO anon, authenticated
  USING (id IN ('global_settings', 'categories', 'page_layout') OR public.is_staff());
DROP POLICY IF EXISTS "Admins write site content" ON public.app_content;
CREATE POLICY "Admins write site content" ON public.app_content FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP TRIGGER IF EXISTS app_content_updated_at ON public.app_content;
CREATE TRIGGER app_content_updated_at BEFORE UPDATE ON public.app_content
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── UI section toggles ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ui_settings (
  id text PRIMARY KEY DEFAULT 'default',
  show_hero boolean NOT NULL DEFAULT true,
  show_quoter boolean NOT NULL DEFAULT true,
  show_catalog boolean NOT NULL DEFAULT true,
  show_reviews boolean NOT NULL DEFAULT true,
  show_services boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ui_settings ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.ui_settings TO anon, authenticated;
GRANT INSERT, UPDATE ON public.ui_settings TO authenticated;
GRANT ALL ON public.ui_settings TO service_role;
DROP POLICY IF EXISTS "Public reads UI settings" ON public.ui_settings;
CREATE POLICY "Public reads UI settings" ON public.ui_settings FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Admins write UI settings" ON public.ui_settings;
CREATE POLICY "Admins write UI settings" ON public.ui_settings FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
INSERT INTO public.ui_settings (id) VALUES ('default') ON CONFLICT (id) DO NOTHING;

-- ── products (catalog / portfolio) ──────────────────────
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE CHECK (length(slug) BETWEEN 1 AND 120),
  cat text NOT NULL DEFAULT '3d',
  name_en text NOT NULL DEFAULT '',
  name_es text,
  name_fr text,
  desc_en text,
  desc_es text,
  desc_fr text,
  tag_en text,
  tag_es text,
  tag_fr text,
  material_en text,
  material_es text,
  material_fr text,
  dimensions text,
  lead text NOT NULL DEFAULT 'week',
  price_cad numeric(12,2) NOT NULL DEFAULT 0 CHECK (price_cad >= 0),
  stock integer,
  image_key text,
  image_url text,
  popular boolean NOT NULL DEFAULT false,
  published boolean NOT NULL DEFAULT false,
  rating numeric(3,2) NOT NULL DEFAULT 0,
  review_count integer NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.products TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
DROP POLICY IF EXISTS "Public reads published products" ON public.products;
CREATE POLICY "Public reads published products" ON public.products FOR SELECT TO anon, authenticated
  USING (published OR public.is_staff());
DROP POLICY IF EXISTS "Staff manage products" ON public.products;
CREATE POLICY "Staff manage products" ON public.products FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());
DROP TRIGGER IF EXISTS products_updated_at ON public.products;
CREATE TRIGGER products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── orders (created server-side; only staff read/manage) ──
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE DEFAULT ('JTP-' || upper(substr(md5(gen_random_uuid()::text), 1, 6))),
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text,
  lang text NOT NULL DEFAULT 'en',
  notes text,
  status public.order_status NOT NULL DEFAULT 'nuevo',
  total_cad numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_slug text,
  name text NOT NULL,
  qty integer NOT NULL DEFAULT 1 CHECK (qty >= 1),
  unit_price_cad numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
GRANT SELECT, UPDATE, DELETE ON public.orders, public.order_items TO authenticated;
GRANT ALL ON public.orders, public.order_items TO service_role;
DROP POLICY IF EXISTS "Staff manage orders" ON public.orders;
CREATE POLICY "Staff manage orders" ON public.orders FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());
DROP POLICY IF EXISTS "Staff manage order items" ON public.order_items;
CREATE POLICY "Staff manage order items" ON public.order_items FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());
DROP TRIGGER IF EXISTS orders_updated_at ON public.orders;
CREATE TRIGGER orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── contact messages ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (length(name) BETWEEN 1 AND 120),
  email text NOT NULL CHECK (length(email) BETWEEN 3 AND 255),
  phone text CHECK (phone IS NULL OR length(phone) <= 40),
  body text NOT NULL CHECK (length(body) BETWEEN 1 AND 2000),
  lang text NOT NULL DEFAULT 'en',
  status public.request_status NOT NULL DEFAULT 'nuevo',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
GRANT INSERT ON public.messages TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
DROP POLICY IF EXISTS "Visitors send new messages" ON public.messages;
CREATE POLICY "Visitors send new messages" ON public.messages FOR INSERT TO anon, authenticated
  WITH CHECK (status = 'nuevo');
DROP POLICY IF EXISTS "Staff manage messages" ON public.messages;
CREATE POLICY "Staff manage messages" ON public.messages FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());
DROP TRIGGER IF EXISTS messages_updated_at ON public.messages;
CREATE TRIGGER messages_updated_at BEFORE UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── quotes (existing table: add the columns the quote form and admin use) ──
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS customer_name text;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS customer_email text;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS qty integer NOT NULL DEFAULT 1;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS color text;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS infill text;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS quality text;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS volume_cm3 numeric(12,2);
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS estimate_cad numeric(12,2);
-- Requests from the public form have no logged-in user.
ALTER TABLE public.quotes ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.quotes ALTER COLUMN service SET DEFAULT '';
ALTER TABLE public.quotes ALTER COLUMN material SET DEFAULT '';
ALTER TABLE public.quotes ALTER COLUMN estimated_price SET DEFAULT 0;
-- The admin uses nuevo / en_proceso / cerrado.
DO $$ BEGIN
  IF (SELECT data_type FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'quotes' AND column_name = 'status') = 'text' THEN
    DROP POLICY IF EXISTS "Users submit pending quotes" ON public.quotes;
    ALTER TABLE public.quotes ALTER COLUMN status DROP DEFAULT;
    ALTER TABLE public.quotes ALTER COLUMN status TYPE public.request_status
      USING (CASE WHEN status IN ('nuevo', 'en_proceso', 'cerrado') THEN status ELSE 'nuevo' END)::public.request_status;
    ALTER TABLE public.quotes ALTER COLUMN status SET DEFAULT 'nuevo';
  END IF;
END $$;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quotes TO authenticated;
GRANT ALL ON public.quotes TO service_role;
DROP POLICY IF EXISTS "Staff manage quotes" ON public.quotes;
CREATE POLICY "Staff manage quotes" ON public.quotes FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());
DROP TRIGGER IF EXISTS quotes_updated_at ON public.quotes;
CREATE TRIGGER quotes_updated_at BEFORE UPDATE ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── private bucket for files attached to quote requests ──
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('design-files', 'design-files', false, 5242880)
ON CONFLICT (id) DO NOTHING;
DROP POLICY IF EXISTS "Staff read design files" ON storage.objects;
CREATE POLICY "Staff read design files" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'design-files' AND public.is_staff());
