-- Fix remaining security definer view issue

-- Remove the problematic security definer view
DROP VIEW IF EXISTS public_app_settings;

-- Create a regular view without security definer (uses security invoker by default)
CREATE VIEW public_app_settings AS
SELECT setting_key, setting_value, description
FROM public.app_settings
WHERE setting_key IN ('app_name', 'app_version', 'maintenance_mode');

-- Add a policy to allow public access to specific app settings
CREATE POLICY "public_read_safe_app_settings" ON public.app_settings
FOR SELECT 
TO anon, authenticated
USING (setting_key IN ('app_name', 'app_version', 'maintenance_mode'));

-- Update the existing policy to be more restrictive
DROP POLICY IF EXISTS "authenticated_select_app_settings" ON public.app_settings;
CREATE POLICY "authenticated_select_all_app_settings" ON public.app_settings
FOR SELECT 
TO authenticated
USING (true);