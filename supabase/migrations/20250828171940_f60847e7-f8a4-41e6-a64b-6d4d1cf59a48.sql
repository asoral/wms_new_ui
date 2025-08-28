-- Fix critical security vulnerability in subscribers table
-- Remove email-based access and ensure only user_id-based authentication

-- First, ensure all existing records have user_id populated
-- Link records by email where user_id is null
UPDATE public.subscribers 
SET user_id = auth_users.id
FROM auth.users auth_users
WHERE subscribers.user_id IS NULL 
AND subscribers.email = auth_users.email;

-- Make user_id non-nullable for better security
ALTER TABLE public.subscribers 
ALTER COLUMN user_id SET NOT NULL;

-- Drop all existing insecure RLS policies
DROP POLICY IF EXISTS "select_own_subscription" ON public.subscribers;
DROP POLICY IF EXISTS "update_own_subscription" ON public.subscribers;
DROP POLICY IF EXISTS "delete_own_subscription" ON public.subscribers;
DROP POLICY IF EXISTS "authenticated_users_can_insert_own_subscription" ON public.subscribers;

-- Create new secure RLS policies using only user_id authentication
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

-- Keep the service role policy for edge functions (this one is secure)
-- service_role_can_insert_subscriptions policy remains unchanged