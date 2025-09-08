-- Create enum for permissions
CREATE TYPE public.permission_type AS ENUM ('view_valuations', 'view_sensitive_data', 'admin_access');

-- Create user_permissions table
CREATE TABLE public.user_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  permission permission_type NOT NULL,
  granted_by UUID,
  granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, permission)
);

-- Enable RLS
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- Create policies for user_permissions
CREATE POLICY "Users can view their own permissions" 
ON public.user_permissions 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all permissions" 
ON public.user_permissions 
FOR ALL 
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Create security definer function to check permissions
CREATE OR REPLACE FUNCTION public.has_permission(p_user_id UUID, p_permission permission_type)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_permissions
    WHERE user_id = p_user_id
      AND permission = p_permission
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > now())
  );
$$;

-- Create convenience function for current user
CREATE OR REPLACE FUNCTION public.current_user_has_permission(p_permission permission_type)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_permission(auth.uid(), p_permission);
$$;

-- Create function to grant permission to a user
CREATE OR REPLACE FUNCTION public.grant_user_permission(
  p_user_id UUID,
  p_permission permission_type,
  p_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS VOID
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can grant permissions
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Only administrators can grant permissions';
  END IF;

  INSERT INTO public.user_permissions (user_id, permission, granted_by, expires_at)
  VALUES (p_user_id, p_permission, auth.uid(), p_expires_at)
  ON CONFLICT (user_id, permission) 
  DO UPDATE SET
    is_active = true,
    granted_by = auth.uid(),
    expires_at = p_expires_at,
    granted_at = now();
    
  -- Log the permission grant
  PERFORM log_sensitive_operation(
    auth.uid(),
    'grant_permission',
    'user_permissions',
    p_user_id::text,
    NULL,
    jsonb_build_object(
      'permission', p_permission,
      'granted_to', p_user_id,
      'expires_at', p_expires_at
    )
  );
END;
$$;

-- Create function to revoke permission from a user
CREATE OR REPLACE FUNCTION public.revoke_user_permission(
  p_user_id UUID,
  p_permission permission_type
)
RETURNS VOID
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can revoke permissions
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Only administrators can revoke permissions';
  END IF;

  UPDATE public.user_permissions 
  SET is_active = false
  WHERE user_id = p_user_id AND permission = p_permission;
  
  -- Log the permission revocation
  PERFORM log_sensitive_operation(
    auth.uid(),
    'revoke_permission',
    'user_permissions',
    p_user_id::text,
    jsonb_build_object('permission', p_permission),
    NULL
  );
END;
$$;