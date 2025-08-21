
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log('=== CREATE-CHECKOUT FUNCTION START ===');
  
  if (req.method === "OPTIONS") {
    console.log('Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  console.log('Request method:', req.method);
  console.log('Request headers:', Object.fromEntries(req.headers.entries()));

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    console.log('Step 1: Getting authorization header');
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No Authorization header found");
    }
    
    console.log('Step 2: Extracting token');
    const token = authHeader.replace("Bearer ", "");
    console.log('Token length:', token.length);
    
    console.log('Step 3: Getting user from Supabase');
    const { data, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) {
      console.log('User auth error:', userError);
      throw new Error(`User authentication failed: ${userError.message}`);
    }
    
    const user = data.user;
    console.log('Step 4: User retrieved:', { id: user?.id, email: user?.email });
    if (!user?.email) throw new Error("User not authenticated or email not available");

    console.log('Step 5: Setting monthly fee');
    // Monthly fee in cents ($15.00)
    const monthlyFee = 1500;
    console.log('Monthly fee set to:', monthlyFee);

    console.log('Step 6: Initializing Stripe');
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY environment variable not found");
    }
    
    const stripe = new Stripe(stripeKey, { 
      apiVersion: "2023-10-16",
    });
    
    // Log Stripe key info (safely)
    console.log('Stripe key starts with:', stripeKey.substring(0, 7));
    console.log('Stripe key mode:', stripeKey.startsWith('sk_live_') ? 'LIVE' : stripeKey.startsWith('sk_test_') ? 'TEST' : 'UNKNOWN');
    
    console.log('Step 7: Checking for existing Stripe customer');
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }
    console.log('Customer ID:', customerId || 'Will create new customer');

    console.log('Step 8: Preparing checkout session');
    const origin = req.headers.get("origin") || "https://0b254384-a178-46e7-85bb-4de1df76205a.sandbox.lovable.dev";
    console.log('Origin:', origin);
    
    console.log('Step 9: Creating Stripe checkout session');
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: "WMS Monthly Subscription" },
            unit_amount: monthlyFee,
            recurring: { interval: "month" },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${origin}/subscription-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/app/home`,
    });

    console.log('Step 10: Stripe session created successfully:', {
      session_id: session.id,
      url_exists: !!session.url,
      customer_id: customerId || 'new customer'
    });

    console.log('Step 11: Updating subscriber record if needed');
    // Update subscriber with customer ID if new
    if (!customerId && customers.data.length === 0) {
      console.log('Creating new Stripe customer');
      const newCustomer = await stripe.customers.create({ email: user.email });
      console.log('New customer created:', newCustomer.id);
      
      const { error: updateError } = await supabaseClient
        .from("subscribers")
        .update({ stripe_customer_id: newCustomer.id })
        .eq("email", user.email);
        
      if (updateError) {
        console.log('Error updating subscriber:', updateError);
        // Don't throw here, just log the error
      }
    }

    console.log('Step 12: Returning successful response');
    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error('=== ERROR IN CREATE-CHECKOUT ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error details:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      details: error.stack 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
