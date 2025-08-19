-- Check and fix any remaining security definer properties

-- Check if the view has security_invoker set to false (which makes it security definer)
-- Set security_invoker to true (security invoker mode)
ALTER VIEW public_app_settings SET (security_invoker = true);

-- Also check for any other views that might exist
DO $$
DECLARE
    view_rec record;
BEGIN
    -- Loop through all views in public schema and ensure they use security_invoker
    FOR view_rec IN 
        SELECT viewname 
        FROM pg_views 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('ALTER VIEW public.%I SET (security_invoker = true)', view_rec.viewname);
    END LOOP;
END
$$;