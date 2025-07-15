-- Fix critical RLS security vulnerabilities

-- 1. Fix subscribers table policies
DROP POLICY IF EXISTS "update_own_subscription" ON public.subscribers;
CREATE POLICY "update_own_subscription" 
  ON public.subscribers 
  FOR UPDATE 
  USING (user_id = auth.uid() OR email = auth.email());

-- 2. Restrict app_settings to authenticated users only (remove public access)
DROP POLICY IF EXISTS "update_app_settings" ON public.app_settings;
CREATE POLICY "update_app_settings" 
  ON public.app_settings 
  FOR UPDATE 
  USING (auth.role() = 'authenticated');

-- 3. Add missing DELETE policies for security completeness
CREATE POLICY "delete_own_subscription" 
  ON public.subscribers 
  FOR DELETE 
  USING (user_id = auth.uid() OR email = auth.email());

CREATE POLICY "delete_own_profile" 
  ON public.profiles 
  FOR DELETE 
  USING (auth.uid() = id);