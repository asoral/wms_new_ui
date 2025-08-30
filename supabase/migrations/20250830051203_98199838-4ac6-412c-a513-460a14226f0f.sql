-- Fix remaining security linter issues
-- Address function search paths and security definer view

-- 1. Fix function search paths by setting search_path parameter
CREATE OR REPLACE FUNCTION public.can_access_subscription(target_user_id uuid)
RETURNS boolean AS $$
BEGIN
    RETURN (
        target_user_id = auth.uid() OR 
        public.is_admin(auth.uid())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = 'public';

CREATE OR REPLACE FUNCTION public.log_security_event(
    event_type text,
    details jsonb DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    PERFORM public.log_sensitive_operation(
        auth.uid(),
        event_type,
        'security_event',
        NULL,
        NULL,
        jsonb_build_object(
            'event_type', event_type,
            'details', details,
            'timestamp', now(),
            'ip_address', inet_client_addr()
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

CREATE OR REPLACE FUNCTION public.audit_profile_update()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.erpnext_api_key_encrypted IS DISTINCT FROM NEW.erpnext_api_key_encrypted) OR
       (OLD.erpnext_api_secret_encrypted IS DISTINCT FROM NEW.erpnext_api_secret_encrypted) THEN
        PERFORM public.log_sensitive_operation(
            auth.uid(),
            'credential_update',
            'profiles',
            NEW.id::text,
            jsonb_build_object('had_credentials', OLD.erpnext_api_key_encrypted IS NOT NULL),
            jsonb_build_object('has_credentials', NEW.erpnext_api_key_encrypted IS NOT NULL)
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- 2. Remove the problematic security definer view and replace with a function
-- Drop the view that was causing security issues
DROP VIEW IF EXISTS public.safe_profiles;

-- Create a function instead that returns safe profile data
CREATE OR REPLACE FUNCTION public.get_safe_profile(profile_id uuid DEFAULT auth.uid())
RETURNS TABLE (
    id uuid,
    email text,
    full_name text,
    erpnext_url text,
    erpnext_default_company text,
    erpnext_pallet_template_item text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    has_api_credentials boolean
) AS $$
BEGIN
    -- Only return data for the user's own profile or if they're an admin
    IF profile_id = auth.uid() OR public.is_admin(auth.uid()) THEN
        RETURN QUERY
        SELECT 
            p.id,
            p.email,
            p.full_name,
            p.erpnext_url,
            p.erpnext_default_company,
            p.erpnext_pallet_template_item,
            p.created_at,
            p.updated_at,
            (p.erpnext_api_key_encrypted IS NOT NULL) as has_api_credentials
        FROM public.profiles p
        WHERE p.id = profile_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = 'public';

COMMENT ON FUNCTION public.get_safe_profile IS 'Safe function to get user profiles that excludes encrypted API credentials. Use this for UI display instead of direct table access.';