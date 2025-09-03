import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { email, password, fullName, erpnextCredentials } = await req.json()

    // Validate required fields
    if (!email || !password || !fullName) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Sanitize and validate ERPNext credentials
    const sanitizedCredentials = {
      erpnext_url: erpnextCredentials?.erpnext_url?.trim() || '',
      erpnext_api_key: erpnextCredentials?.erpnext_api_key?.trim() || '',
      erpnext_api_secret: erpnextCredentials?.erpnext_api_secret?.trim() || ''
    }

    // Validate URL format
    if (sanitizedCredentials.erpnext_url) {
      try {
        new URL(sanitizedCredentials.erpnext_url)
      } catch {
        return new Response(
          JSON.stringify({ error: 'Invalid ERPNext URL format' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Create user with Supabase Auth
    const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
      email: email.trim(),
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName.trim()
      }
    })

    if (authError) {
      console.error('Auth error:', authError)
      return new Response(
        JSON.stringify({ error: authError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Store ERPNext credentials securely if provided
    if (authData.user && sanitizedCredentials.erpnext_url && 
        sanitizedCredentials.erpnext_api_key && sanitizedCredentials.erpnext_api_secret) {
      
      const { error: profileError } = await supabaseClient
        .rpc('update_user_erpnext_credentials', {
          p_erpnext_url: sanitizedCredentials.erpnext_url,
          p_erpnext_api_key: sanitizedCredentials.erpnext_api_key,
          p_erpnext_api_secret: sanitizedCredentials.erpnext_api_secret
        })

      if (profileError) {
        console.error('Profile update error:', profileError)
        // User created but credentials failed - log but don't fail the signup
        console.log('User created but ERPNext credentials update failed for:', email)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'User created successfully',
        user: { id: authData.user.id, email: authData.user.email }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Secure signup error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})