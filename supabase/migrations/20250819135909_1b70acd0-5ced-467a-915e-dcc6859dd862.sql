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

-- Create audit function for sensitive settings access
CREATE OR REPLACE FUNCTION public.audit_app_settings_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log changes to sensitive settings
  IF TG_OP = 'UPDATE' AND OLD.setting_key IN ('monthly_fee_cents', 'stripe_webhook_secret') THEN
    PERFORM public.log_sensitive_operation(
      auth.uid(),
      'update_sensitive_setting',
      'app_settings',
      OLD.setting_key,
      jsonb_build_object('old_value', '[REDACTED]'),
      jsonb_build_object('new_value', '[REDACTED]', 'setting_key', NEW.setting_key)
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Add trigger for auditing sensitive setting changes
CREATE TRIGGER audit_app_settings_changes
  AFTER UPDATE ON public.app_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_app_settings_change();