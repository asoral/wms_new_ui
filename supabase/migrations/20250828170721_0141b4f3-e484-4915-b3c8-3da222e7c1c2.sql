-- Security Fix: Remove email-based access from subscribers table RLS policies
-- This migration removes the dangerous email-based access that could allow 
-- unauthorized users to access payment data and customer information

-- First, ensure all existing records have user_id populated
-- Update any records where user_id might be null by linking via email
UPDATE subscribers 
SET user_id = (
  SELECT id FROM auth.users 
  WHERE email = subscribers.email 
  LIMIT 1
)
WHERE user_id IS NULL;

-- Make user_id non-nullable for better security
ALTER TABLE subscribers 
ALTER COLUMN user_id SET NOT NULL;

-- Drop all existing insecure policies that use email-based access
DROP POLICY IF EXISTS "authenticated_users_can_insert_own_subscription" ON subscribers;
DROP POLICY IF EXISTS "select_own_subscription" ON subscribers;
DROP POLICY IF EXISTS "update_own_subscription" ON subscribers;
DROP POLICY IF EXISTS "delete_own_subscription" ON subscribers;

-- Create new secure policies that only use user_id-based authentication
CREATE POLICY "users_can_insert_own_subscription" ON subscribers
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_can_select_own_subscription" ON subscribers
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "users_can_update_own_subscription" ON subscribers
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_can_delete_own_subscription" ON subscribers
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Keep the service role policy for edge functions (this is secure)
-- No changes needed to "service_role_can_insert_subscriptions" policy