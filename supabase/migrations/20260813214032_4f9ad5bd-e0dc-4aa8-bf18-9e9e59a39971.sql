-- Check if the policy already exists to avoid errors
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_roles' 
        AND policyname = 'Service role can manage all roles'
    ) THEN
        CREATE POLICY "Service role can manage all roles" 
        ON public.user_roles 
        FOR ALL 
        TO service_role 
        USING (true) 
        WITH CHECK (true);
    END IF;
END
$$;

-- Ensure service_role has all permissions
GRANT ALL ON public.user_roles TO service_role;
GRANT SELECT ON public.user_roles TO authenticated;
