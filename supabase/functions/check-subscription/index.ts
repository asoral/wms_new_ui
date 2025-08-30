
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    // Force refresh of environment variable
    const stripeKey = Deno.env.get("STRIPEKEY");
    logStep("Retrieved Stripe key", { hasKey: !!stripeKey, keyLength: stripeKey?.length || 0 });
    
    if (!stripeKey || stripeKey.trim() === '') {
      throw new Error(`STRIPEKEY is empty or not set. Available env vars: ${Object.keys(Deno.env.toObject()).join(', ')}`);  
    }
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");

    logStep("User authenticated", { userId: user.id, email: user.email });

    // Check current subscriber status
    const { data: subscriber, error: subError } = await supabaseClient
      .from("subscribers")
      .select("*")
      .eq("email", user.email)
      .single();

    if (subError && subError.code !== 'PGRST116') {
      throw new Error(`Subscriber lookup error: ${subError.message}`);
    }

    const now = new Date();
    let isTrialActive = false;
    let trialDaysLeft = 0;
    let hasAccess = false;

    if (subscriber) {
      // Check if payment exempt FIRST - no need for Stripe if exempt
      if (subscriber.payment_exempt) {
        hasAccess = true;
        logStep("User is payment exempt - granting access", { email: user.email });
        
        return new Response(JSON.stringify({
          hasAccess: true,
          isTrialActive: false,
          trialDaysLeft: 0,
          subscribed: true,
          paymentExempt: true,
          subscriptionEnd: null,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      } else {
        // Check trial status
        if (subscriber.trial_end) {
          const trialEnd = new Date(subscriber.trial_end);
          isTrialActive = now < trialEnd;
          trialDaysLeft = isTrialActive ? Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;
        }

        // Initialize Stripe
        const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
        
        // Check Stripe subscription if trial has ended
        if (!isTrialActive && subscriber.stripe_customer_id) {
          const subscriptions = await stripe.subscriptions.list({
            customer: subscriber.stripe_customer_id,
            status: "active",
            limit: 1,
          });
          
          const hasActiveSubscription = subscriptions.data.length > 0;
          let subscriptionEnd = null;

          if (hasActiveSubscription) {
            const subscription = subscriptions.data[0];
            subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
            hasAccess = true;
            logStep("Active subscription found", { subscriptionId: subscription.id });

            // Update subscriber record
            await supabaseClient
              .from("subscribers")
              .update({
                subscribed: true,
                subscription_end: subscriptionEnd,
                is_trial_active: false,
                updated_at: new Date().toISOString(),
              })
              .eq("email", user.email);
          } else {
            hasAccess = false;
            logStep("No active subscription found");
          }
        } else if (isTrialActive) {
          hasAccess = true;
          logStep("Trial is active", { daysLeft: trialDaysLeft });
        }

        // Update trial status if needed
        if (subscriber.is_trial_active && !isTrialActive) {
          await supabaseClient
            .from("subscribers")
            .update({
              is_trial_active: false,
              updated_at: new Date().toISOString(),
            })
            .eq("email", user.email);
        }
      }
    } else {
      // No subscriber record found - this shouldn't happen with the trigger
      hasAccess = false;
      logStep("No subscriber record found");
    }

    return new Response(JSON.stringify({
      hasAccess,
      isTrialActive,
      trialDaysLeft,
      subscribed: subscriber?.subscribed || false,
      paymentExempt: subscriber?.payment_exempt || false,
      subscriptionEnd: subscriber?.subscription_end,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage, hasAccess: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
