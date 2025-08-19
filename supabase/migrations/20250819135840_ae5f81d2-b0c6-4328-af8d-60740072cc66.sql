-- Create user roles system for secure access control
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table for role-based access control
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin');
$$;

-- RLS policies for user_roles table
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert user roles"
ON public.user_roles
FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update user roles"
ON public.user_roles
FOR UPDATE
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete user roles"
ON public.user_roles
FOR DELETE
USING (public.is_admin(auth.uid()));

-- Drop the overly permissive app_settings policy
DROP POLICY IF EXISTS "authenticated_select_all_app_settings" ON public.app_settings;

-- Create secure app_settings policies
-- Allow public read access to safe settings only
CREATE POLICY "public_read_safe_settings"
ON public.app_settings
FOR SELECT
USING (setting_key = ANY (ARRAY['app_name', 'app_version', 'maintenance_mode', 'support_email']));

-- Allow admin access to all settings
CREATE POLICY "admin_full_access_app_settings"
ON public.app_settings
FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Allow authenticated users to read their own user-specific settings (if any)
CREATE POLICY "users_read_own_settings"
ON public.app_settings
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND setting_key LIKE 'user_%'
  AND setting_value::jsonb ? auth.uid()::text
);

-- Secure the public_app_settings view with RLS
ALTER VIEW public.public_app_settings SET (security_invoker = true);

-- Add RLS policies to any tables that might not have them
-- Note: Views inherit RLS from underlying tables, but we ensure proper access

-- Create audit function for sensitive operations
CREATE OR REPLACE FUNCTION public.audit_sensitive_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log access to sensitive settings
  IF TG_OP = 'SELECT' AND OLD.setting_key IN ('monthly_fee_cents', 'stripe_webhook_secret', 'admin_api_key') THEN
    PERFORM public.log_sensitive_operation(
      auth.uid(),
      'access_sensitive_setting',
      'app_settings',
      OLD.setting_key,
      NULL,
      jsonb_build_object('setting_key', OLD.setting_key, 'accessed_at', now())
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Add trigger for auditing sensitive setting access
CREATE TRIGGER audit_app_settings_access
  AFTER SELECT OR UPDATE ON public.app_settings
  FOR EACH ROW
  WHEN (OLD.setting_key IN ('monthly_fee_cents', 'stripe_webhook_secret', 'admin_api_key'))
  EXECUTE FUNCTION public.audit_sensitive_access();

-- Insert default admin role for the first user (adjust user_id as needed)
-- This should be done manually for the actual admin user
-- INSERT INTO public.user_roles (user_id, role, created_by) 
-- VALUES ('YOUR_USER_ID_HERE', 'admin', 'YOUR_USER_ID_HERE');