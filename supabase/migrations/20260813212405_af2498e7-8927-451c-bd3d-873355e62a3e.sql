
-- Add policy to allow service_role to manage all user roles
-- This is necessary because the server function uses supabaseAdmin (service_role)
-- to assign the admin role after creating the user.

CREATE POLICY "Service role can manage all roles"
ON public.user_roles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Also ensure authenticated users can insert their own role if needed (though we use admin API)
-- But for now, the critical fix is allowing the service_role to bypass RLS or having an explicit policy.
-- Since it's a server-side action using supabaseAdmin, a service_role policy is best.
