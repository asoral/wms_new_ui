-- Fix handle_new_user trigger to work with encrypted credentials
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_api_key text;
  v_api_secret text;
BEGIN
  -- Extract credentials from metadata
  v_api_key := new.raw_user_meta_data ->> 'erpnext_api_key';
  v_api_secret := new.raw_user_meta_data ->> 'erpnext_api_secret';
  
  -- Insert into profiles table with encrypted credentials
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    erpnext_url,
    erpnext_api_key_encrypted,
    erpnext_api_secret_encrypted,
    erpnext_default_company,
    erpnext_pallet_template_item
  )
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(new.raw_user_meta_data ->> 'erpnext_url', ''),
    CASE 
      WHEN v_api_key IS NOT NULL AND v_api_key != '' 
      THEN encrypt_secret(v_api_key)
      ELSE NULL
    END,
    CASE 
      WHEN v_api_secret IS NOT NULL AND v_api_secret != '' 
      THEN encrypt_secret(v_api_secret)
      ELSE NULL
    END,
    COALESCE(new.raw_user_meta_data ->> 'erpnext_default_company', ''),
    COALESCE(new.raw_user_meta_data ->> 'erpnext_pallet_template_item', '')
  );
  
  -- Initialize trial period for new user
  INSERT INTO public.subscribers (
    user_id, 
    email, 
    trial_start, 
    trial_end, 
    is_trial_active,
    subscribed
  )
  VALUES (
    new.id,
    new.email,
    now(),
    now() + interval '15 days',
    true,
    false
  );
  
  RETURN new;
END;
$$;