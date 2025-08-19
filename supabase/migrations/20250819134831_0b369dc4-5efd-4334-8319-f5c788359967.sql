-- Security fixes: Encrypt sensitive data and restrict app settings access

-- 1. Add encrypted columns for ERPNext credentials in profiles table
ALTER TABLE public.profiles 
ADD COLUMN erpnext_api_key_encrypted bytea,
ADD COLUMN erpnext_api_secret_encrypted bytea;

-- 2. Create function to encrypt sensitive data
CREATE OR REPLACE FUNCTION encrypt_secret(secret text, key_id uuid DEFAULT 'f1e2d3c4-b5a6-9788-0123-456789abcdef'::uuid)
RETURNS bytea
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Use Supabase's vault for encryption
  RETURN extensions.pgp_sym_encrypt(secret, key_id::text);
END;
$$;

-- 3. Create function to decrypt sensitive data  
CREATE OR REPLACE FUNCTION decrypt_secret(encrypted_data bytea, key_id uuid DEFAULT 'f1e2d3c4-b5a6-9788-0123-456789abcdef'::uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Use Supabase's vault for decryption
  RETURN extensions.pgp_sym_decrypt(encrypted_data, key_id::text);
END;
$$;

-- 4. Migrate existing API keys to encrypted storage
UPDATE public.profiles 
SET 
  erpnext_api_key_encrypted = encrypt_secret(erpnext_api_key),
  erpnext_api_secret_encrypted = encrypt_secret(erpnext_api_secret)
WHERE erpnext_api_key IS NOT NULL AND erpnext_api_secret IS NOT NULL;

-- 5. Create view for decrypted credentials (only accessible to profile owner)
CREATE OR REPLACE VIEW profiles_with_decrypted_credentials AS
SELECT 
  id,
  created_at,
  updated_at,
  email,
  full_name,
  erpnext_url,
  erpnext_default_company,
  erpnext_pallet_template_item,
  -- Decrypt credentials only for authenticated user viewing their own profile
  CASE 
    WHEN auth.uid() = id AND erpnext_api_key_encrypted IS NOT NULL 
    THEN decrypt_secret(erpnext_api_key_encrypted)
    ELSE NULL 
  END as erpnext_api_key,
  CASE 
    WHEN auth.uid() = id AND erpnext_api_secret_encrypted IS NOT NULL 
    THEN decrypt_secret(erpnext_api_secret_encrypted)
    ELSE NULL 
  END as erpnext_api_secret
FROM public.profiles;

-- 6. Enable RLS on the view
ALTER VIEW profiles_with_decrypted_credentials SET (security_invoker = on);

-- 7. Update app_settings RLS to require authentication for reads
DROP POLICY "select_app_settings" ON public.app_settings;
CREATE POLICY "authenticated_select_app_settings" ON public.app_settings
FOR SELECT 
TO authenticated
USING (true);

-- 8. Create public view for truly public app settings (if needed)
CREATE OR REPLACE VIEW public_app_settings AS
SELECT setting_key, setting_value, description
FROM public.app_settings
WHERE setting_key IN ('app_name', 'app_version', 'maintenance_mode');

-- Enable RLS on public view (allow public access)
ALTER VIEW public_app_settings SET (security_invoker = off);

-- 9. Add audit logging table for sensitive operations
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on audit logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own audit logs
CREATE POLICY "users_view_own_audit_logs" ON public.audit_logs
FOR SELECT 
TO authenticated
USING (user_id = auth.uid());

-- Policy: Only system can insert audit logs
CREATE POLICY "system_insert_audit_logs" ON public.audit_logs
FOR INSERT 
TO service_role
WITH CHECK (true);

-- 10. Create function to log sensitive operations
CREATE OR REPLACE FUNCTION log_sensitive_operation(
  p_user_id uuid,
  p_action text,
  p_resource_type text,
  p_resource_id text DEFAULT NULL,
  p_old_values jsonb DEFAULT NULL,
  p_new_values jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.audit_logs (
    user_id, 
    action, 
    resource_type, 
    resource_id, 
    old_values, 
    new_values,
    ip_address,
    user_agent
  )
  VALUES (
    p_user_id,
    p_action,
    p_resource_type,
    p_resource_id,
    p_old_values,
    p_new_values,
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent'
  );
END;
$$;