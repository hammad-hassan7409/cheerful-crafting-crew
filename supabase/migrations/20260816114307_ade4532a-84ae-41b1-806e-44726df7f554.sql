-- 1. categories and products hardening
-- Fix "Admin full access" policies to actually check for admin role
DROP POLICY IF EXISTS "Admin full access for categories" ON public.categories;
CREATE POLICY "Admins can manage categories" ON public.categories
    FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admin full access for products" ON public.products;
CREATE POLICY "Admins can manage products" ON public.products
    FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 2. settings hardening
-- Restrict read access to settings to admins ONLY, 
-- except we must allow authenticated users to read it since the code currently fetches it on index/product pages.
-- But wait, if any signed-up user can read settings, that's what the scan flagged.
-- However, we only have one admin user 'ammarhassan1888@gmail.com'. 
-- Let's stick to the scan's advice and restrict it to admins.

DROP POLICY IF EXISTS "Authenticated users can read settings" ON public.settings;
CREATE POLICY "Admins can read settings" ON public.settings 
FOR SELECT TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));

-- Also update management policy for settings
DROP POLICY IF EXISTS "Admins can manage settings" ON public.settings;
CREATE POLICY "Admins can manage settings" ON public.settings 
FOR ALL TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));
