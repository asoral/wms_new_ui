-- Fix the get_user_erpnext_credentials function to only use encrypted columns
-- This function was broken after we removed the unencrypted columns for security

CREATE OR REPLACE FUNCTION public.get_user_erpnext_credentials()
RETURNS TABLE(
    erpnext_url text, 
    erpnext_api_key text, 
    erpnext_api_secret text, 
    erpnext_default_company text, 
    erpnext_pallet_template_item text
)
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = 'public'
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.erpnext_url,
        CASE 
            WHEN p.erpnext_api_key_encrypted IS NOT NULL 
            THEN decrypt_secret(p.erpnext_api_key_encrypted)
            ELSE NULL::text
        END as erpnext_api_key,
        CASE 
            WHEN p.erpnext_api_secret_encrypted IS NOT NULL 
            THEN decrypt_secret(p.erpnext_api_secret_encrypted)
            ELSE NULL::text
        END as erpnext_api_secret,
        p.erpnext_default_company,
        p.erpnext_pallet_template_item
    FROM public.profiles p
    WHERE p.id = auth.uid();
END;
$$;

-- Add comment for documentation
COMMENT ON FUNCTION public.get_user_erpnext_credentials IS 'Securely retrieves and decrypts user ERPNext credentials. Only returns data for the authenticated user.';