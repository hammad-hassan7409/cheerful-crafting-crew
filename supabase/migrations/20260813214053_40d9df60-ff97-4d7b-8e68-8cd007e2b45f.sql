-- Revoke public execution access to address security linter warning
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon;

-- Grant execution only to service_role (and owner by default)
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO service_role;
