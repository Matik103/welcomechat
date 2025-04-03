
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

// This is a secure function that retrieves secrets from Supabase
// It only returns specific allowed secrets based on the request

const allowedSecrets = [
  'LLAMA_CLOUD_API_KEY',
  'OPENAI_API_KEY',
  'RESEND_API_KEY'
]

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse the request to get the keys
    const { keys } = await req.json()
    
    // Validate input
    if (!keys || !Array.isArray(keys)) {
      return new Response(
        JSON.stringify({ error: 'Invalid request. Expected an array of secret keys.' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Filter out any disallowed secrets
    const validKeys = keys.filter(key => 
      typeof key === 'string' && allowedSecrets.includes(key)
    )

    if (validKeys.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No valid secret keys requested.' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create result object with the requested secrets
    const result: Record<string, string> = {}
    
    for (const key of validKeys) {
      const value = Deno.env.get(key)
      if (value) {
        result[key] = value
      }
    }

    return new Response(
      JSON.stringify(result),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Error processing request:', error)
    
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
