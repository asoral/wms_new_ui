-- Migrate existing ERPNext credentials from user metadata to encrypted profiles table
-- This handles users who have credentials in auth.users metadata but not in profiles table

DO $$
DECLARE
    user_record RECORD;
BEGIN
    -- Loop through users who have ERPNext credentials in metadata but not in profiles
    FOR user_record IN 
        SELECT 
            u.id,
            u.raw_user_meta_data ->> 'erpnext_url' as url,
            u.raw_user_meta_data ->> 'erpnext_api_key' as api_key,
            u.raw_user_meta_data ->> 'erpnext_api_secret' as api_secret,
            u.raw_user_meta_data ->> 'erpnext_default_company' as default_company
        FROM auth.users u
        WHERE 
            u.raw_user_meta_data ? 'erpnext_api_key' 
            AND u.raw_user_meta_data ? 'erpnext_api_secret'
            AND NOT EXISTS (
                SELECT 1 FROM public.profiles p 
                WHERE p.id = u.id 
                AND p.erpnext_api_key_encrypted IS NOT NULL
            )
    LOOP
        -- Update the profile with encrypted credentials
        UPDATE public.profiles 
        SET 
            erpnext_url = user_record.url,
            erpnext_api_key_encrypted = encrypt_secret(user_record.api_key),
            erpnext_api_secret_encrypted = encrypt_secret(user_record.api_secret),
            erpnext_default_company = user_record.default_company,
            updated_at = now()
        WHERE id = user_record.id;
        
        -- Log the migration for audit purposes
        INSERT INTO public.audit_logs (
            user_id, 
            action, 
            resource_type, 
            resource_id,
            new_values
        ) VALUES (
            user_record.id,
            'migrate_credentials_from_metadata',
            'profiles',
            user_record.id::text,
            jsonb_build_object(
                'migrated_from', 'user_metadata',
                'has_url', user_record.url IS NOT NULL,
                'has_credentials', true,
                'migration_timestamp', now()
            )
        );
        
        RAISE NOTICE 'Migrated credentials for user: %', user_record.id;
    END LOOP;
END $$;