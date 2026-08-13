-- Allow public read access to product-media bucket
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Public Access'
    ) THEN
        CREATE POLICY "Public Access" ON storage.objects
            FOR SELECT
            TO public
            USING (bucket_id = 'product-media');
    END IF;
END
$$;

-- Allow authenticated users to upload to product-media bucket
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Authenticated Upload'
    ) THEN
        CREATE POLICY "Authenticated Upload" ON storage.objects
            FOR INSERT
            TO authenticated
            WITH CHECK (bucket_id = 'product-media');
    END IF;
END
$$;

-- Allow authenticated users to update objects in product-media bucket
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Authenticated Update'
    ) THEN
        CREATE POLICY "Authenticated Update" ON storage.objects
            FOR UPDATE
            TO authenticated
            USING (bucket_id = 'product-media');
    END IF;
END
$$;

-- Allow authenticated users to delete objects in product-media bucket
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Authenticated Delete'
    ) THEN
        CREATE POLICY "Authenticated Delete" ON storage.objects
            FOR DELETE
            TO authenticated
            USING (bucket_id = 'product-media');
    END IF;
END
$$;