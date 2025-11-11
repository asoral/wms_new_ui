
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

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    
    // Create client with user's JWT token (respects RLS)
    const userSupabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { 
        auth: { persistSession: false },
        global: {
          headers: {
            Authorization: authHeader
          }
        }
      }
    );

    const { data: userData, error: userError } = await userSupabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");

    logStep("User authenticated", { userId: user.id, email: user.email });

    // Use the secure database function to get subscription status
    const { data: statusData, error: statusError } = await userSupabaseClient
      .rpc('get_user_subscription_status')
      .single();

    if (statusError) {
      logStep("Error fetching subscription status", { error: statusError });
      throw new Error(`Subscription status error: ${statusError.message}`);
    }

    logStep("Subscription status retrieved", { 
      hasAccess: statusData.has_access,
      paymentExempt: statusData.payment_exempt 
    });

    // If user doesn't have access and isn't payment exempt, check Stripe
    if (!statusData.has_access && !statusData.payment_exempt) {
      // Need service role to update subscriber record with Stripe data
      const stripeKey = Deno.env.get("STRIPEKEY");
      if (!stripeKey || stripeKey.trim() === '') {
        logStep("Stripe key not configured, skipping Stripe check");
      } else {
        const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
        
        // Get subscriber record to check for stripe_customer_id
        const { data: subscriber } = await supabaseClient
          .from("subscribers")
          .select("stripe_customer_id, email")
          .eq("user_id", user.id)
          .single();

        if (subscriber?.stripe_customer_id) {
          const subscriptions = await stripe.subscriptions.list({
            customer: subscriber.stripe_customer_id,
            status: "active",
            limit: 1,
          });
          
          if (subscriptions.data.length > 0) {
            const subscription = subscriptions.data[0];
            const subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
            
            logStep("Active Stripe subscription found", { subscriptionId: subscription.id });

            // Update subscriber record with service role
            await supabaseClient
              .from("subscribers")
              .update({
                subscribed: true,
                subscription_end: subscriptionEnd,
                is_trial_active: false,
                updated_at: new Date().toISOString(),
              })
              .eq("user_id", user.id);

            // Return updated status
            return new Response(JSON.stringify({
              hasAccess: true,
              isTrialActive: false,
              trialDaysLeft: 0,
              subscribed: true,
              paymentExempt: false,
              subscriptionEnd: subscriptionEnd,
            }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 200,
            });
          }
        }
      }
    }

    // Return the status from the database function
    return new Response(JSON.stringify({
      hasAccess: statusData.has_access,
      isTrialActive: statusData.is_trial_active,
      trialDaysLeft: statusData.trial_days_left,
      subscribed: statusData.subscribed,
      paymentExempt: statusData.payment_exempt,
      subscriptionEnd: statusData.subscription_end,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    // Log detailed error information server-side only
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    
    // Return generic error to client without exposing internal details
    return new Response(JSON.stringify({ 
      error: 'Failed to check subscription status. Please try again.',
      hasAccess: false 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
