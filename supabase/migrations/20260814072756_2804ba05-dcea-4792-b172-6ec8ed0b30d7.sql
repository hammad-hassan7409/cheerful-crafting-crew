ALTER TABLE public.products ADD COLUMN IF NOT EXISTS description text;

GRANT ALL ON public.products TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT SELECT ON public.products TO anon;