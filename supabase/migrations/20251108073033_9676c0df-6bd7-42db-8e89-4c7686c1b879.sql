-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "update_app_settings" ON public.app_settings;

-- Create a new admin-only policy for updating app settings
CREATE POLICY "admin_only_update_app_settings" 
ON public.app_settings 
FOR UPDATE 
USING (public.is_admin(auth.uid()));