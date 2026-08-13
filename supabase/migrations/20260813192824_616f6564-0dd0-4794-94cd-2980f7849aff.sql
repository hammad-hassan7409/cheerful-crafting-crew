-- Allow public access to read files
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Public Access" ON storage.objects 
          FOR SELECT USING (bucket_id = 'product-media');
    END IF;
END $$;

-- Allow authenticated users to upload files
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated Upload' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Authenticated Upload" ON storage.objects 
          FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-media');
    END IF;
END $$;

-- Allow authenticated users to update/delete their files
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated Update' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Authenticated Update" ON storage.objects 
          FOR UPDATE TO authenticated USING (bucket_id = 'product-media');
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated Delete' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Authenticated Delete" ON storage.objects 
          FOR DELETE TO authenticated USING (bucket_id = 'product-media');
    END IF;
END $$;
