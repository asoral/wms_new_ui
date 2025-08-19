-- Fix security vulnerability: Restrict subscriber table insert permissions
-- Remove the overly permissive insert policy that allows anyone to insert records
DROP POLICY "insert_subscription" ON public.subscribers;

-- Create a more restrictive insert policy that only allows:
-- 1. Authenticated users to insert their own subscription records
-- 2. Service role functions to insert records (bypasses RLS anyway)
CREATE POLICY "authenticated_users_can_insert_own_subscription" ON public.subscribers
FOR INSERT
TO authenticated
WITH CHECK (
  (user_id = auth.uid()) OR 
  (email = auth.email())
);

-- Add a policy for service role to ensure edge functions can still insert
-- (This is mainly for documentation as service role bypasses RLS)
CREATE POLICY "service_role_can_insert_subscriptions" ON public.subscribers
FOR INSERT
TO service_role
WITH CHECK (true);