-- Add additional security to can_access_subscription function
-- This function now includes audit logging for sensitive subscription access

CREATE OR REPLACE FUNCTION public.can_access_subscription(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Only allow users to access their own subscription data
    -- Admins are explicitly NOT allowed to bypass this for security
    RETURN target_user_id = auth.uid();
END;
$$;

-- Add a separate admin function for subscription management if needed
CREATE OR REPLACE FUNCTION public.admin_can_view_subscription(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Only admins can use this function
    IF NOT public.is_admin(auth.uid()) THEN
        RETURN false;
    END IF;
    
    -- Log admin access to subscription data
    PERFORM public.log_sensitive_operation(
        auth.uid(),
        'admin_view_subscription',
        'subscribers',
        target_user_id::text,
        NULL,
        jsonb_build_object('accessed_at', now())
    );
    
    RETURN true;
END;
$$;

-- Create a secure function to get only non-sensitive subscription data
CREATE OR REPLACE FUNCTION public.get_user_subscription_status()
RETURNS TABLE(
    has_access boolean,
    is_trial_active boolean,
    trial_days_left integer,
    subscribed boolean,
    payment_exempt boolean,
    subscription_end timestamp with time zone
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_subscriber record;
    v_trial_end timestamp with time zone;
    v_now timestamp with time zone := now();
BEGIN
    -- Get subscriber data for current user only
    SELECT * INTO v_subscriber
    FROM public.subscribers
    WHERE user_id = auth.uid()
    LIMIT 1;
    
    -- If no subscriber record exists, return no access
    IF v_subscriber IS NULL THEN
        RETURN QUERY SELECT false, false, 0, false, false, NULL::timestamp with time zone;
        RETURN;
    END IF;
    
    -- Check if payment exempt (highest priority)
    IF v_subscriber.payment_exempt THEN
        RETURN QUERY SELECT true, false, 0, true, true, NULL::timestamp with time zone;
        RETURN;
    END IF;
    
    -- Calculate trial status
    v_trial_end := v_subscriber.trial_end;
    
    RETURN QUERY SELECT 
        (v_subscriber.subscribed OR (v_trial_end IS NOT NULL AND v_trial_end > v_now)) as has_access,
        (v_trial_end IS NOT NULL AND v_trial_end > v_now) as is_trial_active,
        CASE 
            WHEN v_trial_end IS NOT NULL AND v_trial_end > v_now 
            THEN CEIL(EXTRACT(EPOCH FROM (v_trial_end - v_now)) / 86400)::integer
            ELSE 0
        END as trial_days_left,
        v_subscriber.subscribed,
        v_subscriber.payment_exempt,
        v_subscriber.subscription_end;
END;
$$;

-- Update RLS policy to be more restrictive
DROP POLICY IF EXISTS "secure_subscription_select" ON public.subscribers;

CREATE POLICY "secure_subscription_select" ON public.subscribers
FOR SELECT
USING (
    -- Users can ONLY see their own subscription
    user_id = auth.uid()
);

-- Add policy for admin viewing with audit logging
CREATE POLICY "admin_view_subscription" ON public.subscribers
FOR SELECT
USING (
    admin_can_view_subscription(user_id)
);