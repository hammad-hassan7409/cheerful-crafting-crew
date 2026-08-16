-- Fix security scan findings:
-- 1. user_roles hardening
ALTER TABLE public.user_roles ALTER COLUMN role DROP DEFAULT;
DROP POLICY IF EXISTS "Authenticated users can view roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- 2. storage hardening (product-media bucket)
-- We need to check if the public SELECT policy should remain public. 
-- The user request was "PROTECT AR EDITZ SAMPLES FROM UNAUTHORIZED COPYING" earlier.
-- Current policy is "Public Access" on storage.objects for SELECT. 
-- However, the code uses signed URLs (useSignedUrl). 
-- If the bucket is public, signed URLs are redundant but the scan warned about tampering.

DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete" ON storage.objects;

CREATE POLICY "Admins can upload media" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'product-media' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update media" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'product-media' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete media" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'product-media' AND public.has_role(auth.uid(), 'admin'));

-- 3. settings hardening
DROP POLICY IF EXISTS "Anyone can read settings" ON public.settings;
CREATE POLICY "Authenticated users can read settings" ON public.settings FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.settings FROM anon;
