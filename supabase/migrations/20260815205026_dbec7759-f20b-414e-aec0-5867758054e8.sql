ALTER TABLE public.products ADD COLUMN is_pinned BOOLEAN DEFAULT FALSE;
ALTER TABLE public.products ADD COLUMN pin_order INTEGER DEFAULT 0;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
GRANT SELECT ON public.products TO anon;