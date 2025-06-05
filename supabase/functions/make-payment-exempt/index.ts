
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[MAKE-PAYMENT-EXEMPT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Set the specific email to be payment exempt
    const email = "asoral@dexciss.io";
    logStep("Setting payment exempt status for", { email });

    // Update or insert the subscriber record with payment_exempt set to true
    const { data, error } = await supabaseClient
      .from("subscribers")
      .upsert({
        email: email,
        payment_exempt: true,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'email'
      });

    if (error) {
      throw new Error(`Failed to update subscriber: ${error.message}`);
    }

    logStep("Successfully set payment exempt status");

    return new Response(JSON.stringify({ success: true, email }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
