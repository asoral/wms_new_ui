-- Fix critical security vulnerability in subscribers table
-- Remove email-based access and ensure only user_id-based authentication

-- First, ensure all existing records have user_id populated
-- This is safe to run multiple times
UPDATE public.subscribers 
SET user_id = auth_users.id
FROM auth.users auth_users
WHERE subscribers.user_id IS NULL 
AND subscribers.email = auth_users.email;

-- Make user_id non-nullable for better security (only if not already set)
DO $$ 
BEGIN
    IF (SELECT is_nullable FROM information_schema.columns 
        WHERE table_name = 'subscribers' 
        AND column_name = 'user_id' 
        AND table_schema = 'public') = 'YES' THEN
        ALTER TABLE public.subscribers ALTER COLUMN user_id SET NOT NULL;
    END IF;
END $$;

-- Drop all existing insecure RLS policies that use email-based access
DROP POLICY IF EXISTS "select_own_subscription" ON public.subscribers;
DROP POLICY IF EXISTS "update_own_subscription" ON public.subscribers;
DROP POLICY IF EXISTS "delete_own_subscription" ON public.subscribers;
DROP POLICY IF EXISTS "authenticated_users_can_insert_own_subscription" ON public.subscribers;

-- Also drop any secure policies that might exist to recreate them consistently
DROP POLICY IF EXISTS "users_can_select_own_subscription" ON public.subscribers;
DROP POLICY IF EXISTS "users_can_update_own_subscription" ON public.subscribers;
DROP POLICY IF EXISTS "users_can_delete_own_subscription" ON public.subscribers;
DROP POLICY IF EXISTS "users_can_insert_own_subscription" ON public.subscribers;

-- Create new secure RLS policies using ONLY user_id authentication
CREATE POLICY "users_can_select_own_subscription" ON public.subscribers
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "users_can_update_own_subscription" ON public.subscribers
FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "users_can_delete_own_subscription" ON public.subscribers
FOR DELETE
USING (user_id = auth.uid());

CREATE POLICY "users_can_insert_own_subscription" ON public.subscribers
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Note: service_role_can_insert_subscriptions policy is kept as it's secure
-- It allows edge functions to manage subscriptions using service role key