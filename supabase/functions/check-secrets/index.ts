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
    // Get the list of required secrets to check
    const { required } = await req.json()
    
    if (!Array.isArray(required) || required.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No required secrets specified' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Log headers and environment variables
    console.log('Request headers:', Object.fromEntries(req.headers.entries()))
    console.log('Environment variables:', {
      OPENAI_API_KEY: !!Deno.env.get('OPENAI_API_KEY'),
      LLAMA_CLOUD_API_KEY: !!Deno.env.get('LLAMA_CLOUD_API_KEY'),
      FIRECRAWL_API_KEY: !!Deno.env.get('FIRECRAWL_API_KEY')
    })
    
    // Check if all required secrets are set
    const missing = []
    const available = []
    for (const secretName of required) {
      // Check environment variables first
      let value = Deno.env.get(secretName)
      
      // If not found in environment, check request headers
      if (!value) {
        const headerValue = req.headers.get(secretName)
        if (headerValue) {
          value = headerValue
        }
      }
      
      // If still not found, check VITE_ prefixed environment variables
      if (!value) {
        value = Deno.env.get(`VITE_${secretName}`)
      }

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
