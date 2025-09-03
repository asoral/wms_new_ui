-- Fix public_app_settings table security issues
-- First, enable RLS on public_app_settings table
ALTER TABLE public.public_app_settings ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access to safe settings only
CREATE POLICY "public_read_safe_public_settings" 
ON public.public_app_settings 
FOR SELECT 
USING (setting_key = ANY (ARRAY['app_name'::text, 'app_version'::text, 'maintenance_mode'::text, 'support_email'::text]));

-- Create policy to allow admins full access
CREATE POLICY "admin_full_access_public_settings" 
ON public.public_app_settings 
FOR ALL 
USING (is_admin(auth.uid())) 
WITH CHECK (is_admin(auth.uid()));

-- Migrate any existing data from public_app_settings to app_settings if needed
INSERT INTO public.app_settings (setting_key, setting_value, description)
SELECT setting_key, setting_value, description
FROM public.public_app_settings
WHERE NOT EXISTS (
    SELECT 1 FROM public.app_settings 
    WHERE app_settings.setting_key = public_app_settings.setting_key
);