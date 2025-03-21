
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the service role key
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the current user for authentication
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get the list of required secrets to check
    const { required } = await req.json()
    
    if (!Array.isArray(required) || required.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No required secrets specified' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Check if all required secrets are set
    const missing = []
    const available = []
    for (const secretName of required) {
      const value = Deno.env.get(secretName)
      if (!value) {
        missing.push(secretName)
      } else {
        available.push(secretName)
      }
    }
    
    // Check specifically for Firecrawl API key if it's among required keys
    const hasFirecrawlKey = Deno.env.get('FIRECRAWL_API_KEY') !== undefined
    
    return new Response(
      JSON.stringify({ 
        success: missing.length === 0,
        missing,
        available,
        checked: required,
        firecrawl: {
          configured: hasFirecrawlKey || required.includes('FIRECRAWL_API_KEY') && missing.indexOf('FIRECRAWL_API_KEY') === -1
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
