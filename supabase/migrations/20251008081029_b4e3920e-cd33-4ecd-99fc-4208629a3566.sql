-- Fix public_app_settings security issue by removing the insecure view
DROP VIEW IF EXISTS public.public_app_settings CASCADE;

-- The app_settings table already has proper RLS policies
-- Applications should use app_settings directly instead of this view