
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Starting check-email-exists function');
    
    // Initialize the Supabase client with the service role key
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { email } = await req.json()
    
    console.log('Checking if email exists:', email);
    
    if (!email) {
      console.log('No email provided in request');
      return new Response(
        JSON.stringify({ error: 'Email is required', exists: false }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 // Always return 200 to avoid CORS issues
        }
      )
    }

    // Check if user exists by email
    console.log('Calling getUserByEmail for:', email);
    const { data: user, error: userError } = await supabase.auth.admin.getUserByEmail(email)
    
    // Handle errors from getUserByEmail
    if (userError && userError.message !== 'User not found') {
      console.error('Error checking user by email:', userError);
      return new Response(
        JSON.stringify({ error: userError.message, exists: false }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

    // Return whether the user exists
    const exists = !!user
    console.log('User exists:', exists);
    
    return new Response(
      JSON.stringify({ exists }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('Unexpected error in check-email-exists:', error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'An unexpected error occurred', exists: false }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 // Always return 200 to avoid CORS issues
      }
    )
  }
})
