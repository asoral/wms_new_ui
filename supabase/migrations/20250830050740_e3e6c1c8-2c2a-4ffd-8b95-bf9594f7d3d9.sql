-- Comprehensive Security Fix - Phase 2
-- Address remaining critical security vulnerabilities

-- 1. CRITICAL: Remove unencrypted API credentials from profiles table
-- These are a major security risk and should not exist alongside encrypted versions
DO $$ 
BEGIN
    -- Only drop if the column exists to avoid errors on repeated runs
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'profiles' 
               AND column_name = 'erpnext_api_key' 
               AND table_schema = 'public') THEN
        ALTER TABLE public.profiles DROP COLUMN erpnext_api_key;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'profiles' 
               AND column_name = 'erpnext_api_secret' 
               AND table_schema = 'public') THEN
        ALTER TABLE public.profiles DROP COLUMN erpnext_api_secret;
    END IF;
END $$;

-- 2. Secure the public_app_settings view by adding RLS policies
-- This view exposes app settings and needs proper access control
ALTER VIEW public.public_app_settings SET (security_barrier = true);

-- Add RLS policies for public_app_settings view access
-- Note: Views inherit RLS from underlying tables, but we need to ensure the base table is secure
DO $$
BEGIN
    -- Check if RLS is enabled on app_settings table
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'app_settings' 
        AND schemaname = 'public' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- 3. Add additional security audit triggers for sensitive operations
-- Monitor access to encrypted credentials
CREATE OR REPLACE FUNCTION public.audit_credential_access()
RETURNS TRIGGER AS $$
BEGIN
    -- Log any access to encrypted credentials
    IF TG_OP = 'SELECT' THEN
        PERFORM public.log_sensitive_operation(
            auth.uid(),
            'credential_access',
            'profiles',
            NEW.id::text,
            NULL,
            jsonb_build_object('accessed_at', now(), 'has_encrypted_key', NEW.erpnext_api_key_encrypted IS NOT NULL)
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for credential access auditing (only if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'audit_credential_access_trigger'
    ) THEN
        CREATE TRIGGER audit_credential_access_trigger
            AFTER SELECT ON public.profiles
            FOR EACH ROW
            WHEN (OLD.erpnext_api_key_encrypted IS NOT NULL OR NEW.erpnext_api_key_encrypted IS NOT NULL)
            EXECUTE FUNCTION public.audit_credential_access();
    END IF;
END $$;

-- 4. Add additional protection for subscribers table
-- Create a function to check if user can access subscription data
CREATE OR REPLACE FUNCTION public.can_access_subscription(target_user_id uuid)
RETURNS boolean AS $$
BEGIN
    -- Only the user themselves or admins can access subscription data
    RETURN (
        target_user_id = auth.uid() OR 
        public.is_admin(auth.uid())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Update subscribers RLS policies with additional admin access for support
DROP POLICY IF EXISTS "users_can_select_own_subscription" ON public.subscribers;
CREATE POLICY "secure_subscription_select" ON public.subscribers
FOR SELECT
USING (public.can_access_subscription(user_id));

DROP POLICY IF EXISTS "users_can_update_own_subscription" ON public.subscribers;
CREATE POLICY "secure_subscription_update" ON public.subscribers
FOR UPDATE
USING (user_id = auth.uid()); -- Only users can update their own, not admins

-- 5. Secure audit logs with better access control
-- Ensure users can only see their own audit logs and admins can see all
DROP POLICY IF EXISTS "users_view_own_audit_logs" ON public.audit_logs;
CREATE POLICY "secure_audit_log_access" ON public.audit_logs
FOR SELECT
USING (
    user_id = auth.uid() OR 
    public.is_admin(auth.uid())
);

-- 6. Add security monitoring function
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create a view for safe user profile data that excludes sensitive information
CREATE OR REPLACE VIEW public.safe_profiles AS
SELECT 
    id,
    email,
    full_name,
    erpnext_url,
    erpnext_default_company,
    erpnext_pallet_template_item,
    created_at,
    updated_at,
    -- Indicate if encrypted credentials exist without exposing them
    (erpnext_api_key_encrypted IS NOT NULL) as has_api_credentials
FROM public.profiles;

-- Set RLS on the safe profiles view
ALTER VIEW public.safe_profiles SET (security_barrier = true);

-- Add comment for documentation
COMMENT ON VIEW public.safe_profiles IS 'Safe view of user profiles that excludes encrypted API credentials. Use this for UI display instead of direct table access.';

-- Add indexes for better performance on security-critical queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscribers_user_id_security 
ON public.subscribers(user_id) WHERE user_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_user_security 
ON public.audit_logs(user_id, created_at) WHERE user_id IS NOT NULL;