
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

    // Get authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      logStep("ERROR: Missing authorization header");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Verify the user is authenticated
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      logStep("ERROR: Invalid token", { authError });
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    logStep("User authenticated", { userId: user.id });

    // Verify the user is an admin
    const { data: isAdmin, error: adminCheckError } = await supabaseClient.rpc('is_admin', {
      _user_id: user.id
    });

    if (adminCheckError || !isAdmin) {
      logStep("ERROR: User is not an admin", { userId: user.id, adminCheckError });
      return new Response(JSON.stringify({ error: "Forbidden: Admin access required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    logStep("Admin access verified", { userId: user.id });

    // Get email from request body
    const { email } = await req.json();
    
    if (!email || typeof email !== 'string') {
      logStep("ERROR: Invalid email in request");
      return new Response(JSON.stringify({ error: "Email is required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

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
    
    return new Response(JSON.stringify({ error: "Operation failed" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
