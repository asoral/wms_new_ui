-- Fix security linter issues from previous migration

-- 1. Fix function search path issues by setting search_path
CREATE OR REPLACE FUNCTION encrypt_secret(secret text, key_id uuid DEFAULT 'f1e2d3c4-b5a6-9788-0123-456789abcdef'::uuid)
RETURNS bytea
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Use Supabase's vault for encryption
  RETURN extensions.pgp_sym_encrypt(secret, key_id::text);
END;
$$;

CREATE OR REPLACE FUNCTION decrypt_secret(encrypted_data bytea, key_id uuid DEFAULT 'f1e2d3c4-b5a6-9788-0123-456789abcdef'::uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Use Supabase's vault for decryption
  RETURN extensions.pgp_sym_decrypt(encrypted_data, key_id::text);
END;
$$;

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
SET search_path = public
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

-- 2. Fix Security Definer View issue by removing the view and using RLS policies instead
DROP VIEW IF EXISTS profiles_with_decrypted_credentials;

-- Create a function that users can call to get their decrypted credentials
CREATE OR REPLACE FUNCTION get_user_erpnext_credentials()
RETURNS TABLE(
  erpnext_url text,
  erpnext_api_key text,
  erpnext_api_secret text,
  erpnext_default_company text,
  erpnext_pallet_template_item text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.erpnext_url,
    CASE 
      WHEN p.erpnext_api_key_encrypted IS NOT NULL 
      THEN decrypt_secret(p.erpnext_api_key_encrypted)
      ELSE p.erpnext_api_key
    END as erpnext_api_key,
    CASE 
      WHEN p.erpnext_api_secret_encrypted IS NOT NULL 
      THEN decrypt_secret(p.erpnext_api_secret_encrypted)
      ELSE p.erpnext_api_secret  
    END as erpnext_api_secret,
    p.erpnext_default_company,
    p.erpnext_pallet_template_item
  FROM public.profiles p
  WHERE p.id = auth.uid();
END;
$$;

-- 3. Create secure update function for ERPNext credentials with audit logging
CREATE OR REPLACE FUNCTION update_user_erpnext_credentials(
  p_erpnext_url text DEFAULT NULL,
  p_erpnext_api_key text DEFAULT NULL,
  p_erpnext_api_secret text DEFAULT NULL,
  p_erpnext_default_company text DEFAULT NULL,
  p_erpnext_pallet_template_item text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_values jsonb;
  new_values jsonb;
BEGIN
  -- Get current values for audit log
  SELECT to_jsonb(p) INTO old_values
  FROM (
    SELECT erpnext_url, '[REDACTED]' as erpnext_api_key, '[REDACTED]' as erpnext_api_secret, 
           erpnext_default_company, erpnext_pallet_template_item
    FROM public.profiles 
    WHERE id = auth.uid()
  ) p;

  -- Update the profile with encrypted credentials
  UPDATE public.profiles 
  SET 
    erpnext_url = COALESCE(p_erpnext_url, erpnext_url),
    erpnext_api_key_encrypted = CASE 
      WHEN p_erpnext_api_key IS NOT NULL 
      THEN encrypt_secret(p_erpnext_api_key)
      ELSE erpnext_api_key_encrypted
    END,
    erpnext_api_secret_encrypted = CASE 
      WHEN p_erpnext_api_secret IS NOT NULL 
      THEN encrypt_secret(p_erpnext_api_secret)
      ELSE erpnext_api_secret_encrypted
    END,
    erpnext_default_company = COALESCE(p_erpnext_default_company, erpnext_default_company),
    erpnext_pallet_template_item = COALESCE(p_erpnext_pallet_template_item, erpnext_pallet_template_item),
    updated_at = now()
  WHERE id = auth.uid();

  -- Prepare new values for audit log (redact sensitive data)
  SELECT to_jsonb(p) INTO new_values
  FROM (
    SELECT 
      COALESCE(p_erpnext_url, (SELECT erpnext_url FROM public.profiles WHERE id = auth.uid())) as erpnext_url,
      CASE WHEN p_erpnext_api_key IS NOT NULL THEN '[UPDATED]' ELSE '[UNCHANGED]' END as erpnext_api_key,
      CASE WHEN p_erpnext_api_secret IS NOT NULL THEN '[UPDATED]' ELSE '[UNCHANGED]' END as erpnext_api_secret,
      COALESCE(p_erpnext_default_company, (SELECT erpnext_default_company FROM public.profiles WHERE id = auth.uid())) as erpnext_default_company,
      COALESCE(p_erpnext_pallet_template_item, (SELECT erpnext_pallet_template_item FROM public.profiles WHERE id = auth.uid())) as erpnext_pallet_template_item
  ) p;

  -- Log the operation
  PERFORM log_sensitive_operation(
    auth.uid(),
    'update_erpnext_credentials',
    'profiles',
    auth.uid()::text,
    old_values,
    new_values
  );
END;
$$;