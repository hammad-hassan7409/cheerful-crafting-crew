-- Create categories table
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

GRANT SELECT ON public.categories TO anon, authenticated;
GRANT ALL ON public.categories TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.categories TO authenticated;

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for categories" ON public.categories
    FOR SELECT USING (true);

CREATE POLICY "Admin full access for categories" ON public.categories
    FOR ALL TO authenticated USING (true);

-- Create products table
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE NOT NULL,
    media_url TEXT NOT NULL,
    media_type TEXT NOT NULL CHECK (media_type IN ('video', 'image')),
    original_price NUMERIC NOT NULL,
    discounted_price NUMERIC NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

GRANT SELECT ON public.products TO anon, authenticated;
GRANT ALL ON public.products TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.products TO authenticated;

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for products" ON public.products
    FOR SELECT USING (true);

CREATE POLICY "Admin full access for products" ON public.products
    FOR ALL TO authenticated USING (true);

-- Seed initial categories
INSERT INTO public.categories (name) VALUES ('VIDEOS'), ('POSTERS');
