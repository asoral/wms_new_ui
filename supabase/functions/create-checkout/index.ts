
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");

    // Monthly fee in cents ($15.00)
    const monthlyFee = 1500;

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { 
      apiVersion: "2023-10-16",
    });
    
    // Log Stripe key info (safely)
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY") || "";
    console.log('Stripe key starts with:', stripeKey.substring(0, 7));
    console.log('Stripe key mode:', stripeKey.startsWith('sk_live_') ? 'LIVE' : stripeKey.startsWith('sk_test_') ? 'TEST' : 'UNKNOWN');
    
    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    console.log('Creating Stripe checkout session for:', user.email);
    console.log('Monthly fee:', monthlyFee);
    console.log('Origin:', req.headers.get("origin"));
    console.log('Customer ID:', customerId || 'Will create new customer');
    
    const origin = req.headers.get("origin") || "https://0b254384-a178-46e7-85bb-4de1df76205a.sandbox.lovable.dev";
    
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

    console.log('Stripe session created successfully:', {
      session_id: session.id,
      url_exists: !!session.url,
      customer_id: customerId || 'new customer'
    });

    // Update subscriber with customer ID if new
    if (!customerId && customers.data.length === 0) {
      const newCustomer = await stripe.customers.create({ email: user.email });
      await supabaseClient
        .from("subscribers")
        .update({ stripe_customer_id: newCustomer.id })
        .eq("email", user.email);
    }

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
