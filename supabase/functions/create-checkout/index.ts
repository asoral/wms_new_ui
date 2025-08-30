import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log('=== CREATE-CHECKOUT FUNCTION START (v2) ===');
  
  if (req.method === "OPTIONS") {
    console.log('Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Step 1: Basic environment check');
    
    // Check environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const stripeKey = Deno.env.get("STRIPEKEY");
    
    // Force refresh of environment variable
    const refreshedStripeKey = Deno.env.get("STRIPEKEY");
    
    console.log('Environment check:', {
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseKey: !!supabaseKey,
      hasStripeKey: !!refreshedStripeKey,
      stripeKeyStart: refreshedStripeKey?.substring(0, 7) || 'MISSING',
      allEnvVars: Object.keys(Deno.env.toObject()),
      stripeKeyLength: refreshedStripeKey?.length || 0
    });
    
    if (!refreshedStripeKey || refreshedStripeKey.trim() === '') {
      throw new Error(`STRIPEKEY is empty or not set. Available env vars: ${Object.keys(Deno.env.toObject()).join(', ')}`);
    }
    
    // Use the refreshed key
    const finalStripeKey = refreshedStripeKey;
    
    console.log('Step 2: Creating Supabase client');
    const supabaseClient = createClient(
      supabaseUrl ?? "",
      supabaseKey ?? "",
      { auth: { persistSession: false } }
    );

    console.log('Step 3: Getting auth header');
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No Authorization header found");
    }
    
    console.log('Step 4: Extracting token');
    const token = authHeader.replace("Bearer ", "");
    
    console.log('Step 5: Getting user from Supabase');
    const { data, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) {
      console.log('User auth error:', userError);
      throw new Error(`User authentication failed: ${userError.message}`);
    }
    
    const user = data.user;
    if (!user?.email) {
      throw new Error("User not authenticated or email not available");
    }
    
    console.log('Step 6: User authenticated:', user.email);

    console.log('Step 7: Initializing Stripe');
    const stripe = new Stripe(finalStripeKey, { 
      apiVersion: "2023-10-16",
    });
    
    console.log('Step 8: Creating checkout session');
    const origin = req.headers.get("origin") || "https://0b254384-a178-46e7-85bb-4de1df76205a.sandbox.lovable.dev";
    
    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: "WMS Premium Subscription" },
            unit_amount: 1500, // $15.00
            recurring: { interval: "month" },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      subscription_data: {
        trial_period_days: 15,
      },
      success_url: `${origin}/subscription-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/app/home`,
    });

    console.log('Step 9: Session created successfully:', session.id);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
    
  } catch (error) {
    console.error('=== ERROR IN CREATE-CHECKOUT ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      stack: error.stack
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});